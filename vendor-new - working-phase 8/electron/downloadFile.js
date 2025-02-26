// electron/downloadFile.js
import fs from "fs";
import https from "https";
import http from "http";

export function downloadFile(fileUrl, outputPath) {
    return new Promise((resolve, reject) => {
        // Choose protocol based on URL
        const protocol = fileUrl.startsWith("https") ? https : http;
        const file = fs.createWriteStream(outputPath);

        protocol.get(fileUrl, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download file: Status code ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on("finish", () => {
                file.close(() => resolve(outputPath));
            });
        }).on("error", (err) => {
            fs.unlink(outputPath, () => reject(err));
        });
    });
}
