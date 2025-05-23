const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
    restoreApp: () => ipcRenderer.send("restore-app"),
    onNewOrder: (callback) => ipcRenderer.on("new-order", (_, order) => callback(order)),
    getPrinters: () => ipcRenderer.invoke("get-printers"),
    acceptOrder: (order, printer) => ipcRenderer.send("accept-order", order, printer),
    rejectOrder: (order) => ipcRenderer.send("reject-order", order),
    onOrderProcessed: (callback) => ipcRenderer.on("order-processed", (event, data) => callback(data)),
    onNewOrder: (callback) => ipcRenderer.on("new-order", (event, order) => callback(order)),
});