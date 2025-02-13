import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import Order from "../models/order.model.js";  // Import the Order model

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
        let document = {};

        // If a file was uploaded, upload it to S3
        if (req.file) {
            const key = `${Date.now()}-${req.file.originalname}`; // Unique file name
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: key,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
            };

            await s3Client.send(new PutObjectCommand(params));

            // Construct S3 file URL
            document = {
                fileName: req.file.originalname,
                filePath: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
                pages: req.body.pages || 1 // Default to 1 page if not provided
            };
        }

        // Create and save order in database
        const newOrder = new Order({
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
