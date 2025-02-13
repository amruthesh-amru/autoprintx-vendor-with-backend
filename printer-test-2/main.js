import { app, BrowserWindow, ipcMain } from 'electron';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import pdfToPrinter from 'pdf-to-printer';
import path from 'path';

const { print } = pdfToPrinter;

// Fix for __dirname in ES module
const __dirname = dirname(fileURLToPath(import.meta.url));

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,  // Keep this false for security
            sandbox: false,
        },
    });

    mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

ipcMain.handle('print-document', async (event, printOptions) => {
    try {
        await print(printOptions.documentPath, {
            printer: printOptions.printerName,
            paperSize: printOptions.paperSize,
            sides: printOptions.side,
            copies: printOptions.copies,
            monochrome: printOptions.monochrome,
            pages: printOptions.range,
        });
        return { success: true };
    } catch (error) {
        console.error('Printing error:', error);
        return { success: false, error: error.message };
    }
});
