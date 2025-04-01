import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import io from "socket.io-client";
import axios from "axios";
import keytar from "keytar";
import { storeOrder, getOrders, removeOrder } from "./orderStore.js";
import { printOrder } from "./printer.js";
import { downloadFile } from "./downloadFile.js";
import { getAuthToken, logoutVendor } from "./auth.js";

const SERVICE_NAME = "autoprintx";
const ACCOUNT_NAME = "vendor_token";

let win;
let socket = null; // Prevent multiple connections

// Register getPrinters handler first
ipcMain.handle("getPrinters", async () => {
    if (!win) {
        console.error("No window instance found.");
        return [];
    }
    try {
        const printers = await win.webContents.getPrintersAsync();
        console.log("Main process: Printers fetched:", printers);
        return printers;
    } catch (error) {
        console.error("Main process: Error fetching printers:", error);
        return [];
    }
});

async function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(process.cwd(), "electron/preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    try {
        const token = await getAuthToken();
        console.log("Token:", token);
        if (token) {
            win.loadFile(path.join(process.cwd(), "renderer/index.html"));
            // Connect WebSocket and pass the token for authentication
            // connectWebSocket(token);
        } else {
            win.loadFile(path.join(process.cwd(), "renderer/login.html"));
        }
    } catch (error) {
        console.error("Error fetching auth token:", error);
        win.loadFile(path.join(process.cwd(), "renderer/login.html"));
    }
}

ipcMain.on("navigate-to-signup", () => {
    win.loadFile(path.join(process.cwd(), "renderer/signup.html"));
});

ipcMain.on("navigate-to-login", () => {
    win.loadFile(path.join(process.cwd(), "renderer/login.html"));
});

// 🟢 LOGIN HANDLER
ipcMain.handle("login-vendor", async (event, credentials) => {
    try {
        console.log("Sending login request to backend:", credentials);

        const response = await fetch("http://localhost:3000/api/vendor/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
        });

        const data = await response.json();
        console.log("Backend response:", data);

        if (data.success && data.token) {
            // Store token using keytar
            await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, data.token);
            // Connect WebSocket using the token
            // connectWebSocket();
            return { success: true };
        } else {
            return { success: false, message: data.message };
        }
    } catch (error) {
        console.error("Error in Electron login handler:", error);
        return { success: false, message: "Internal error" };
    }
});

// 🟢 LOGOUT HANDLER
ipcMain.on("logout-vendor", async () => {
    console.log("Logging out...");
    await logoutVendor(); // Clear token from keytar
    win.loadFile(path.join(process.cwd(), "renderer/login.html"));
    win.reload(); // Force a full reload of login page
});

// 🟢 SOCKET.IO CONNECTION
// function connectWebSocket() {
//     if (socket && socket.connected) {
//         console.log("WebSocket is already connected.");
//         return;
//     }

//     // Pass the token in the auth option (if backend uses it)
//     socket = io("http://localhost:3000");

//     socket.on("connect", () => {
//         console.log("Connected to WebSocket, id:", socket.id);
//     });

//     socket.on("connect_error", (err) => {
//         console.error("Socket connection error:", err);
//     });

//     socket.on("new-order", (order) => {
//         storeOrder(order);
//         win.webContents.send("new-order", order);
//         console.log("New order received:", order);
//     });
// }

// 🟢 FETCH ORDERS
ipcMain.handle("get-orders", async () => {
    return getOrders();
});

// 🟢 ORDER ACCEPTANCE & PRINTING
ipcMain.on("accept-order", async (_, order, printer) => {
    console.log("Printing Order:", order);

    // Check if a printer is selected; if not, do not proceed
    if (!printer) {
        console.error("No printer selected. Aborting print job.");
        return;
    }

    if (!order.items || order.items.length === 0) {
        console.error("No items found in order");
        return;
    }

    const s3Url = order.items[0].document.filePath; // S3 URL for PDF
    const localDir = path.join(process.cwd(), "electron", "print_jobs");

    if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
    }

    const localFilePath = path.join(localDir, `${order._id}.pdf`);

    try {
        await downloadFile(s3Url, localFilePath);
        console.log("File downloaded:", localFilePath);

        // Print the downloaded file using the selected printer and options
        printOrder(localFilePath, printer, order.items[0].printOptions || {});

        // Cleanup: delete the temporary file after a delay
        setTimeout(() => {
            fs.unlink(localFilePath, (err) => {
                if (err) console.error("Error deleting temp file:", err);
                else console.log("Temporary file deleted:", localFilePath);
            });
        }, 5000);
    } catch (error) {
        console.error("Error in order printing:", error);
    }
});

// 🟢 REJECT ORDER
ipcMain.on("reject-order", (event, order) => {
    console.log("Order Rejected:", order);
    removeOrder(order._id);
    event.sender.send("order-processed", { id: order._id, status: "rejected" });
});

// 🟢 RESTORE WINDOW
ipcMain.on("restore-app", () => {
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
});


// 🟢 QUIT APP WHEN CLOSED
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

// 🟢 INITIATE APP
app.whenReady().then(createWindow);
