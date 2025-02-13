import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import io from 'socket.io-client';
import { storeOrder } from './orderStore.js'; // Adjust path if needed
import { printOrder } from './printer.js';   // Adjust path if needed

let win;
const socket = io("http://localhost:3000");

app.whenReady().then(() => {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(process.cwd(), "electron/preload.js"),
            nodeIntegration: false,
            contextIsolation: true, // Absolutely essential!
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

    ipcMain.on("accept-order", (_, order, printer) => {
        console.log("Main Process: Received print order", order);
        const filePath = path.join(process.cwd(), "electron", "print_jobs", `${order.id}.pdf`);

        printOrder(filePath, printer, order);
    });

    ipcMain.on("reject-order", (event, order) => {
        console.log("Main process: Order Rejected:", order);
        event.sender.send("order-processed", { id: order.id, status: "rejected" });
    });


    // Send 'main-process-ready' AFTER the IPC handlers are defined
    win.webContents.once('ready-to-show', () => {
        win.webContents.send('main-process-ready'); // Send to the renderer process
    });
});
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
