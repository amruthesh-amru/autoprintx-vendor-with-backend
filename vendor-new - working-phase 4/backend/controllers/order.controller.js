// import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"; // Correct import for v3
// import dotenv from "dotenv";
// import Order from "../models/order.model.js"; // Import the Order model
// import mongoose from "mongoose";

// dotenv.config();

// // Create an S3 client
// const s3Client = new S3Client({
//     region: process.env.AWS_REGION,
//     credentials: {
//         accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//         secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
//     }
// });

// export async function processOrder(req, res) {
//     try {
//         const { customer, vendor, printOptions, costEstimate } = req.body;
//         console.log(req.body._id);

//         // Generate the order ID (MongoDB will automatically create _id if not provided)
//         const orderId = req.body._id || new mongoose.Types.ObjectId(); // Use generated ObjectId if not provided

//         let document = {};

//         // If a file was uploaded, upload it to S3 with the new name
//         if (req.file) {
//             // Ensure the file is a PDF
//             if (req.file.mimetype !== "application/pdf") {
//                 return res.status(400).json({ message: "Only PDF files are allowed" });
//             }

//             const key = `${orderId}.pdf`; // Rename file to orderId.pdf
//             const params = {
//                 Bucket: process.env.AWS_BUCKET_NAME,
//                 Key: key,
//                 Body: req.file.buffer,
//                 ContentType: req.file.mimetype
//             };

//             // Use PutObjectCommand to upload to S3
//             const command = new PutObjectCommand(params);
//             await s3Client.send(command);  // Ensure `send()` method is called correctly

//             document = {
//                 fileName: `${orderId}.pdf`,
//                 filePath: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
//                 pages: req.body.pages || 1 // Default to 1 page if not provided
//             };
//         }

//         // Create and save order in database
//         const newOrder = new Order({
//             _id: orderId, // If _id isn't passed, MongoDB auto-generates it
//             customer,
//             vendor,
//             document,
//             printOptions,
//             costEstimate,
//             status: "pending"
//         });

//         const savedOrder = await newOrder.save();

//         // Emit event to connected vendors (if using Socket.IO)
//         const io = req.app.get("io");
//         if (io) io.emit("new-order", savedOrder);

//         res.status(201).json({ message: "Order placed successfully", order: savedOrder });
//     } catch (error) {
//         console.error("Error processing order:", error);
//         res.status(500).json({ message: "Error processing order", error: error.message });
//     }
// }
// controllers/order.controller.js
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import Order from "../models/order.model.js";
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

// Process multiple orders (cart items) in one document
export async function processOrder(req, res) {
    try {
        // Expecting customer, vendor, overall costEstimate, and items (an array)
        const { customer, vendor, costEstimate, items } = req.body;

        // 'items' is an array of cart item objects.
        // If using file uploads with multer, req.files should be an array matching the items order.
        const files = req.files; // e.g., if using upload.array('pdfs')

        const processedItems = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            // Generate a unique ID for this cart item (used for S3 file naming)
            const itemId = new mongoose.Types.ObjectId();
            let document = {};

            if (files && files[i]) {
                // Ensure the file is a PDF
                if (files[i].mimetype !== "application/pdf") {
                    return res.status(400).json({ message: "Only PDF files are allowed" });
                }

                // Create a unique file key using the itemId
                const key = `${itemId}.pdf`;
                const params = {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: key,
                    Body: files[i].buffer,
                    ContentType: files[i].mimetype
                };

                await s3Client.send(new PutObjectCommand(params));

                document = {
                    fileName: `${itemId}.pdf`,
                    filePath: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
                    pages: item.pages || 1  // Use pages from item if provided, else default to 1
                };
            }

            processedItems.push({
                // You may optionally store the original pdf field if needed
                // pdf: item.pdf,
                document,
                printOptions: item.printOptions
            });
        }

        // Create and save a single Order document with the array of items
        const newOrder = new Order({
            customer,
            vendor,
            items: processedItems,
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
