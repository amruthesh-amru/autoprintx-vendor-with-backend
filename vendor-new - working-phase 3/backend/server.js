import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from 'dotenv'
import userRouter from './routes/user.route.js'
import connectDB from './config/DBConnection.js'

import orderRouter from "./routes/order.route.js";

dotenv.config();
connectDB()
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

// Attach Socket.IO instance to the app for use in controllers
app.set('io', io);

// Use the order router for /order endpoints
app.use("/order", orderRouter);
app.use("/user", userRouter);

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