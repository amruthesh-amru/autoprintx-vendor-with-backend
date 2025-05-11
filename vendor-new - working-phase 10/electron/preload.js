// const { contextBridge, ipcRenderer } = require("electron");

// contextBridge.exposeInMainWorld("electron", {
//     restoreApp: () => ipcRenderer.send("restore-app"),
//     onNewOrder: (callback) => ipcRenderer.on("new-order", (_, order) => callback(order)),
//     getPrinters: () => ipcRenderer.invoke("get-printers"),
//     acceptOrder: (order, printer) => ipcRenderer.send("accept-order", order, printer),
//     rejectOrder: (order) => ipcRenderer.send("reject-order", order),
//     onOrderProcessed: (callback) => ipcRenderer.on("order-processed", (event, data) => callback(data)),
//     onNewOrder: (callback) => ipcRenderer.on("new-order", (event, order) => callback(order)),
// });
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electron", {
    restoreApp: () => ipcRenderer.send("restore-app"),
    onNewOrder: (callback) => ipcRenderer.on("new-order", (event, order) => callback(order)),
    getPrinters: () => ipcRenderer.invoke("getPrinters"),
    acceptOrder: (order, printer) => ipcRenderer.send("accept-order", order, printer),
    rejectOrder: (order) => ipcRenderer.send("reject-order", order),
    onOrderProcessed: (callback) => ipcRenderer.on("order-processed", (event, data) => callback(data)),
    getOrders: () => ipcRenderer.invoke("get-orders"),
    signup: (vendorData) => ipcRenderer.invoke("vendor-signup", vendorData),
    navigateToSignup: () => ipcRenderer.send("navigate-to-signup"),
    navigateToLogin: () => ipcRenderer.send("navigate-to-login"),
    loginVendor: (vendorData) => ipcRenderer.invoke("login-vendor", vendorData),
    getGoogleLocation: () => ipcRenderer.invoke("getGoogleLocation"),
    logoutVendor: () => ipcRenderer.send("logout-vendor")
});
contextBridge.exposeInMainWorld("env", {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY
});
