
import printer from "pdf-to-printer";

export function printOrder(filePath, printerName, options) {
    console.log("😶‍🌫️ Received print options:", options);

    const printOptions = {
        printer: printerName,
        copies: options.copies || 1,
        orientation: options.orientation || "portrait",
        monochrome: options.color && options.color.toLowerCase() !== "color",
        side: options.duplex ? options.duplex : (options.duplex ? "duplex" : "simplex"),
        pages: options.pageRange || undefined,
    };

    console.log(`Printing ${filePath} on ${printerName} with options:`, printOptions);

    printer
        .print(filePath, printOptions)
        .then(() => console.log("Print job sent successfully"))
        .catch((err) => console.error("Printing failed:", err));
}

