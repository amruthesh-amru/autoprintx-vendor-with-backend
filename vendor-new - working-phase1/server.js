import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

io.on("connection", (socket) => {
    console.log("Vendor App Connected");
});

// Simulated database or data source (replace with your actual data source)
const orders = {}; // In-memory store (for demonstration purposes)

// Function to fetch order details (replace with your actual logic)
async function getOrderDetails(orderId) {
    // Example: Fetching from a database (replace with your database query)
    return new Promise((resolve) => {
        setTimeout(() => { // Simulate database delay
            resolve({
                details: `Details for order ${orderId} (from database/API)`, // Replace with actual details
                file: "test.pdf",  // Or get the actual file name
                // ... other details
            });
        }, 200); // Simulate 200ms delay
    });
}

// API to receive real orders
app.post("/order", async (req, res) => {
    const order = req.body;
    console.log("Received Order (initial):", order);

    try {
        // 1. Store the initial order (without details)
        orders[order.id] = order; // Store the order initially

        // 2. Fetch order details
        const orderDetails = await getOrderDetails(order.id);

        // 3. Add details to the order object
        order.details = orderDetails.details;
        order.file = orderDetails.file;
        // ... add other details

        console.log("Received Order (with details):", order);

        // 4. Emit the complete order object
        io.emit("new-order", order);

        res.status(200).json({ message: "Order received", order });

    } catch (error) {
        console.error("Error processing order:", error);
        res.status(500).json({ message: "Error processing order" });
    }
});


server.listen(5000, () => console.log("Server running on port 5000"));