import { ipcRenderer } from "electron";

document
    .getElementById("logout-btn")
    .addEventListener("click", async () => {
        await ipcRenderer.invoke("logout-vendor");
        window.location = "login.html"; // Redirect to login page
    });
