// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");
// const cors = require("cors");
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });


app.use(cors());
app.use(express.json());

// In-memory store for orders (for demonstration purposes)
const orders = {};

// Optional: Function to simulate fetching additional details (if needed)
async function getOrderDetails(orderId) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                details: `Additional details for order ${orderId}`,
                // You can include extra information if needed
            });
        }, 200); // Simulate 200ms delay
    });
}

// Modified API endpoint to receive a full order with print options
app.post("/order", async (req, res) => {
    const order = req.body;

    // Validate required fields; adjust as necessary
    if (
        !order.id ||
        !order.documentPath ||
        !order.printerName ||
        !order.paperSize ||
        !order.side ||
        order.copies === undefined ||
        order.monochrome === undefined ||
        !order.range
    ) {
        return res.status(400).json({ message: "Missing required print order fields" });
    }

    console.log("Received Order (initial):", order);

    try {
        // (Optional) Fetch additional details from your database/API if needed
        const orderDetails = await getOrderDetails(order.id);
        order.details = orderDetails.details;
        // Now the order contains both the print options and any additional details

        // Store the complete order in your in-memory store
        orders[order.id] = order;
        console.log("Complete Order:", order);

        // Emit the complete order object to connected clients
        io.emit("new-order", order);

        res.status(200).json({ message: "Order received", order });
    } catch (error) {
        console.error("Error processing order:", error);
        res.status(500).json({ message: "Error processing order" });
    }
});

io.on("connection", (socket) => {
    console.log("Vendor App Connected");
});

// Start the server on port 5000
server.listen(5000, () => console.log("Server running on port 5000"));
