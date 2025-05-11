import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import io from "socket.io-client";
import { storeOrder } from "./orderStore.js"; // Adjust path if needed
import { printOrder } from "./printer.js";   // Adjust path if needed
import { downloadFile } from "./downloadFile.js"; // New helper module
import { getOrders } from "./orderStore.js";
import { removeOrder } from "./orderStore.js";
let win;
const socket = io("http://localhost:3000");
// const socket = io("https://autoprint-x-backend-deploy.onrender.com");


app.whenReady().then(() => {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(process.cwd(), "electron/preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    win.loadFile(path.join(process.cwd(), "renderer/index.html"));

    socket.on("connect", () => {
        console.log("Main process: Connected to WebSocket server, id:", socket.id);
    });

    socket.on("connect_error", (err) => {
        console.error("Socket connection error:", err);
    });

    socket.on("new-order", (order) => {
        storeOrder(order);
        win.webContents.send("new-order", order);
        console.log("Main process: New order sent to renderer:", order);
    });

    ipcMain.handle("getPrinters", async () => {
        try {
            const printers = await win.webContents.getPrintersAsync();
            console.log("Main process: Printers fetched:", printers);
            return printers;
        } catch (error) {
            console.error("Main process: Error fetching printers:", error);
            return [];
        }
    });

    ipcMain.handle("get-orders", async () => {
        return getOrders();
    });

    ipcMain.on("accept-order", async (_, order, printer) => {
        console.log("Main Process: Received print order", order);

        const printOptions = order.items[0].printOptions || {};

        if (!order.items || order.items.length === 0) {
            console.error("No items found in order");
            return;
        }
        // Assume we're printing the first item's PDF
        const s3Url = order.items[0].document.filePath; // This is the S3 URL
        // Prepare a local file path in a temporary folder (e.g., electron/print_jobs)
        const localDir = path.join(process.cwd(), "electron", "print_jobs");
        if (!fs.existsSync(localDir)) {
            fs.mkdirSync(localDir, { recursive: true });
        }
        const localFilePath = path.join(localDir, `${order._id}.pdf`);

        try {
            // Download the file from S3 to local storage
            await downloadFile(s3Url, localFilePath);
            console.log("Main process: File downloaded to", localFilePath);

            // Print the downloaded file with the provided printer and order options


            printOrder(localFilePath, printer, printOptions);

            // Cleanup: delete the temporary file after a delay (adjust delay as needed)
            setTimeout(() => {
                fs.unlink(localFilePath, (err) => {
                    if (err) {
                        console.error("Error cleaning up file:", err);
                    } else {
                        console.log("Temporary file deleted:", localFilePath);
                    }
                });
            }, 5000);
        } catch (error) {
            console.error("Error downloading file for printing:", error);
        }
    });

    ipcMain.on("reject-order", (event, order) => {
        console.log("Main process: Order Rejected:", order);
        // Remove the order from persistent storage
        removeOrder(order._id);
        event.sender.send("order-processed", { id: order._id, status: "rejected" });
    });


    win.webContents.once("ready-to-show", () => {
        win.webContents.send("main-process-ready");
    });
});

ipcMain.on("restore-app", () => {
    if (win.isMinimized()) {
        win.restore();
    }
    win.show();
    win.focus();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
