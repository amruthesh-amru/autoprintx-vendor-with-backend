import mongoose from "mongoose";
const OrderSchema = new mongoose.Schema({
    customer: { type: String, ref: "User", required: true },
    vendor: { type: String, ref: "User" },
    document: {
        fileName: String,
        filePath: String,  // URL or path where the document is stored
        pages: Number,
    },
    printOptions: {
        paperSize: String, // "A4", "A3", etc.
        color: Boolean,    // true for color, false for B&W
        duplex: Boolean,   // double-sided printing
        copies: Number,
        allPageprint: Boolean,
        pagerange: String,
        binding: { type: String, default: "none" }  // e.g., "staple", "spiral", etc.
    },
    status: { type: String, enum: ["pending", "accepted", "printing", "completed", "rejected"], default: "pending" },
    costEstimate: Number,
}, { timestamps: true });

export default mongoose.model("Order", OrderSchema);