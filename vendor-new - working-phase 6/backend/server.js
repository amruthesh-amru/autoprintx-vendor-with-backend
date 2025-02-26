import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from 'dotenv'
import userRouter from './routes/user.route.js'
import connectDB from './config/DBConnection.js'
import orderRouter from "./routes/order.route.js";
import cartRouter from "./routes/cart.route.js";
import Stripe from "stripe";
import paymentRouter from './routes/payment.route.js';
import uploadRouter from "./routes/upload.route.js";
dotenv.config();
connectDB()
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
app.use(cors());
app.use(express.json());

// Attach Socket.IO instance to the app for use in controllers
app.set('io', io);

// Use the order router for /order endpoints
app.use("/order", orderRouter);
app.use("/user", userRouter);
app.use("/order", cartRouter);
app.use("/api/payment/", paymentRouter);
app.use("/api/upload", uploadRouter);

// Route for Stripe webhook
// (Optional) Default route
app.get("/", (req, res) => {
    res.send("Server is running!");
});


const PORT = process.env.PORT || 5000;
server.listen(3000, () => console.log(`Server running on port ${PORT}`));

// Log connection event from Socket.IO
io.on("connection", (socket) => {
    console.log("Vendor App Connected", socket.id);
});