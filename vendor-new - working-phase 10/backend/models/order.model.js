import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema({
    document: {
        fileName: { type: String },
        filePath: { type: String },
        pages: { type: Number, default: 1 },
    },
    printOptions: {
        binding: { type: String, default: "none" },
        color: { type: String },
        copies: { type: Number },
        duplex: { type: Boolean },
        estimatedCost: { type: Number },
        orientation: { type: String },
        pageRange: { type: String },
        paperSize: { type: String },
        selectAll: { type: Boolean },
    }
});

const OrderSchema = new mongoose.Schema({
    customer: { type: String, ref: "User", required: true },
    vendor: { type: String, ref: "Vendor" }, // Update ref to Vendor model
    items: [OrderItemSchema],
    costEstimate: { type: Number },
    status: {
        type: String,
        enum: ["pending", "accepted", "printing", "completed", "rejected"],
        default: "pending"
    },
    location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
}, { timestamps: true });

OrderSchema.index({ location: "2dsphere" }); // Enable geospatial queries

export default mongoose.model("Order", OrderSchema);
