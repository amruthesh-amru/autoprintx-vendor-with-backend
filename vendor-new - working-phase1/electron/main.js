// import { app, BrowserWindow, ipcMain } from "electron"; // dialog is no longer needed here
// import path from "path";
// import { io } from "socket.io-client";
// import { storeOrder, getOrders } from "./orderStore.js";
// import { printOrder } from "./printer.js";

// let win;
// const socket = io("http://localhost:5000");

// app.whenReady().then(() => {
//     win = new BrowserWindow({
//         width: 800,
//         height: 600,
//         webPreferences: {
//             preload: path.join(process.cwd(), "electron/preload.js"),
//             nodeIntegration: false,
//         },
//     });

//     win.loadFile(path.join(process.cwd(), "renderer/index.html"));

//     socket.on("new-order", (order) => {
//         storeOrder(order);
//         win.webContents.send("new-order", order);
//         console.log("Main process: New order sent to renderer:", order);
//     });

//     // Get Printers (Now using webContents.getPrintersAsync())
//     ipcMain.handle("get-printers", async () => {
//         try {
//             const printers = await win.webContents.getPrintersAsync();
//             console.log("Main process: Printers fetched:", printers); // Debugging
//             return printers;
//         } catch (error) {
//             console.error("Main process: Error fetching printers:", error);
//             return; // Return empty array in case of error
//         }
//     });

//     ipcMain.on("accept-order", async (event, order, printerName) => {
//         console.log("Main process: Order Accepted:", order);
//         if (printerName) {
//             printOrder(order.file, printerName);
//             event.sender.send("order-processed", { id: order.id, status: "accepted" });
//         } else {
//             console.log("Main process: No printer selected.");
//         }
//     });

//     ipcMain.on("reject-order", (event, order) => {
//         console.log("Main process: Order Rejected:", order);
//         event.sender.send("order-processed", { id: order.id, status: "rejected" });
//     });
// });

// app.on("window-all-closed", () => {
//     if (process.platform !== "darwin") app.quit();
// });
import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import { io } from "socket.io-client";
import { storeOrder } from "./orderStore.js";
import { printOrder } from "./printer.js";
let win;
const socket = io("http://localhost:5000");

app.whenReady().then(() => {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(process.cwd(), "electron/preload.js"),
            nodeIntegration: false,
        },
    });

    win.loadFile(path.join(process.cwd(), "renderer/index.html"));

    socket.on("new-order", (order) => {
        storeOrder(order);
        win.webContents.send("new-order", order);
        console.log("Main process: New order sent to renderer:", order);
    });

    // Get available printers
    ipcMain.handle("get-printers", async () => {
        try {
            const printers = await win.webContents.getPrintersAsync();
            console.log("Main process: Printers fetched:", printers);
            return printers;
        } catch (error) {
            console.error("Main process: Error fetching printers:", error);
            return [];
        }
    });

    // Accept order & print

    ipcMain.on("accept-order", (_, order, printer) => {
        console.log("Main Process: Received print order", order);
        const filePath = path.join(process.cwd(), "electron", "print_jobs", `${order.id}.pdf`);

        printOrder(filePath, printer, order);
    });

    // Reject order
    ipcMain.on("reject-order", (event, order) => {
        console.log("Main process: Order Rejected:", order);
        event.sender.send("order-processed", { id: order.id, status: "rejected" });
    });
});
ipcMain.handle("show-input-dialog", async (event, message) => {
    const { response } = await dialog.showMessageBox({
        type: "question",
        buttons: ["OK"],
        title: "Input Required",
        message,
        inputType: "text", // This won't work in Electron dialogs. Use a modal instead.
    });
    return response || null;
});
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
