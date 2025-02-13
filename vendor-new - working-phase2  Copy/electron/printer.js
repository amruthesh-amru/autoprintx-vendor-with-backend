// import { exec } from "child_process";

// export function printOrder(filePath) {
//     const command = process.platform === "win32"
//         ? `print /D:"Microsoft Print to PDF" ${filePath}`
//         : `lp ${filePath}`;

//     exec(command, (error) => {
//         if (error) {
//             console.error("Error printing file:", error);
//         } else {
//             console.log("Print job submitted successfully.");
//         }
//     });
// }
import printer from "pdf-to-printer";

export function printOrder(filePath, printerName, options) {
    const printOptions = {
        printer: printerName,
        copies: options.copies || 1,
        paperSize: options.paperSize || "A4",
        monochrome: options.monochrome || false,
        duplex: options.side === "duplex",
        range: options.range || undefined,
    };

    console.log(`Printing ${filePath} on ${printerName} with options:`, printOptions);

    printer
        .print(filePath, printOptions)
        .then(() => console.log("Print job sent successfully"))
        .catch((err) => console.error("Printing failed:", err));
}
