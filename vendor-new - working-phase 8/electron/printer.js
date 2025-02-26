
import printer from "pdf-to-printer";

export function printOrder(filePath, printerName, options) {
    console.log("😶‍🌫️ Received print options:", options);

    const printOptions = {
        printer: printerName,
        copies: options.copies || 1,
        // Assuming if options.color is "color", we want color printing (monochrome false)
        monochrome: options.color && options.color.toLowerCase() !== "color",
        duplex: options.duplex || false,
        // Use pageRange if provided
        range: options.pageRange || undefined,
    };

    console.log(`Printing ${filePath} on ${printerName} with options:`, printOptions);

    printer
        .print(filePath, printOptions)
        .then(() => console.log("Print job sent successfully"))
        .catch((err) => console.error("Printing failed:", err));
}

