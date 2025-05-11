import Order from "../models/order.model.js";
import Vendor from "../models/vendor.model.js"; // Import vendor model
import User from "../models/user.model.js";

export const getOrders = async (req, res) => {
    try {
        const orders = await orderModel.find();
        if (orders && orders.length > 0) {
            return res.status(200).json({
                success: true,
                message: "Orders fetched successfully",
                orders: orders,
            });
        } else {
            return res.status(404).json({
                success: false,
                message: "No orders found",
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
export async function processOrder(req, res) {
    try {
        const orderData = JSON.parse(req.body.orderData);
        console.log("❤️❤️", orderData);

        const { customer, costEstimate, items, location } = orderData;
        const { longitude, latitude } = location; // Extract location

        if (!longitude || !latitude) {
            return res.status(400).json({ message: "Location is required" });
        }

        // Fetch the customer's name using the ID
        const customerData = await User.findById(customer);
        if (!customerData) {
            return res.status(404).json({ message: "Customer not found" });
        }

        // Find the nearest vendor within a 5km radius
        const nearestVendor = await Vendor.findOne({
            location: {
                $near: {
                    $geometry: { type: "Point", coordinates: [longitude, latitude] },
                    $maxDistance: 5000, // 5km radius
                },
            },
        });

        if (!nearestVendor) {
            return res.status(404).json({ message: "No nearby vendors available" });
        }

        // Process order items
        const processedItems = items.map((item) => ({
            document: item.s3Url
                ? { fileName: item.fileName, filePath: item.s3Url, pages: item.pages || 1 }
                : {},
            printOptions: item.printOptions,
        }));

        // Create and save the order
        const newOrder = new Order({
            customer: customerData.name, // Store customer name
            vendor: nearestVendor._id, // Assign nearest vendor
            items: processedItems,
            costEstimate,
            status: "pending",
            location: { type: "Point", coordinates: [longitude, latitude] },
        });

        const savedOrder = await newOrder.save();

        // Emit event to the assigned vendor (if using Socket.IO)
        const io = req.app.get("io");
        if (io) io.to(nearestVendor._id.toString()).emit("new-order", savedOrder);

        res.status(201).json({ message: "Order placed successfully", order: savedOrder });
    } catch (error) {
        console.error("Error processing order:", error);
        res.status(500).json({ message: "Error processing order", error: error.message });
    }
}
