import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"; // Correct import for v3
import dotenv from "dotenv";
import Order from "../models/order.model.js"; // Import the Order model
import mongoose from "mongoose";

dotenv.config();

// Create an S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

export async function processOrder(req, res) {
    try {
        const { customer, vendor, printOptions, costEstimate } = req.body;
        console.log(req.body._id);

        // Generate the order ID (MongoDB will automatically create _id if not provided)
        const orderId = req.body._id || new mongoose.Types.ObjectId(); // Use generated ObjectId if not provided

        let document = {};

        // If a file was uploaded, upload it to S3 with the new name
        if (req.file) {
            // Ensure the file is a PDF
            if (req.file.mimetype !== "application/pdf") {
                return res.status(400).json({ message: "Only PDF files are allowed" });
            }

            const key = `${orderId}.pdf`; // Rename file to orderId.pdf
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: key,
                Body: req.file.buffer,
                ContentType: req.file.mimetype
            };

            // Use PutObjectCommand to upload to S3
            const command = new PutObjectCommand(params);
            await s3Client.send(command);  // Ensure `send()` method is called correctly

            document = {
                fileName: `${orderId}.pdf`,
                filePath: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
                pages: req.body.pages || 1 // Default to 1 page if not provided
            };
        }

        // Create and save order in database
        const newOrder = new Order({
            _id: orderId, // If _id isn't passed, MongoDB auto-generates it
            customer,
            vendor,
            document,
            printOptions,
            costEstimate,
            status: "pending"
        });

        const savedOrder = await newOrder.save();

        // Emit event to connected vendors (if using Socket.IO)
        const io = req.app.get("io");
        if (io) io.emit("new-order", savedOrder);

        res.status(201).json({ message: "Order placed successfully", order: savedOrder });
    } catch (error) {
        console.error("Error processing order:", error);
        res.status(500).json({ message: "Error processing order", error: error.message });
    }
}
