import Vendor from "../models/vendor.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// ✅ Signup Vendor
export const signupVendor = async (req, res) => {
    try {
        const { email, password, location } = req.body;

        // Validate that location exists and has proper GeoJSON structure
        if (!location || !location.coordinates || location.coordinates.length !== 2) {
            return res.status(400).json({ success: false, message: "Location is required" });
        }

        const existingVendor = await Vendor.findOne({ email });
        if (existingVendor) {
            return res.status(400).json({ success: false, message: "Vendor already exists" });
        }

        const newVendor = new Vendor({
            email,
            password,
            location: location  // Directly use the provided location object
        });

        await newVendor.save();
        res.status(201).json({ success: true, message: "Vendor registered successfully" });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};


export const loginVendor = async (req, res) => {
    try {
        const { email, password } = req.body;

        const vendor = await Vendor.findOne({ email });
        if (!vendor) {
            return res.status(400).json({ success: false, message: "Vendor not found." });
        }

        const isMatch = await bcrypt.compare(password, vendor.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid credentials." });
        }

        // Generate JWT token
        const token = jwt.sign({ id: vendor._id }, process.env.JWT_SECRET, { expiresIn: "48h" });

        return res.json({ success: true, message: "Login successful!", token });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};



