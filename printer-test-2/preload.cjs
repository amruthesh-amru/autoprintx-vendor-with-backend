const { contextBridge, ipcRenderer } = require('electron');
const { io } = require('socket.io-client');

contextBridge.exposeInMainWorld('electronAPI', {
    printDocument: (printOptions) => ipcRenderer.invoke('print-document', printOptions),
    connectToSocket: (url) => {
        const socket = io(url);  // Create the socket

        // *** IMPORTANT: Handle connection and events HERE ***
        socket.on('connect', () => {
            console.log('Preload: Connected to server!');
        });

        socket.on('disconnect', () => {
            console.log('Preload: Disconnected from server!');
        });

        socket.on('connect_error', (error) => {
            console.error('Preload: Connection error:', error);
        });

        socket.on('connect_timeout', () => {
            console.error('Preload: Connection timeout');
        });

        // Any other initial event listeners you need can go here.

        return socket; // Return the configured socket object
    },
});