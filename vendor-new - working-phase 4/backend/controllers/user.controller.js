import userModel from "../models/user.model.js";
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const createToken = async (userId) => {
    try {
        return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
    } catch (error) {
        console.log("Token creation failed", error);
        throw new Error("Token creation failed");
    }
};

// ✅ Updated Register User Function
const registerUser = async (req, res) => {
    const { name, email, password, role, phone, address } = req.body;
    console.log(req.body);


    try {
        if (!name || !email || !password || !role || !phone || !address) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        if (!["customer", "vendor"].includes(role)) {
            return res.status(400).json({ success: false, message: "Invalid role. Must be 'customer' or 'vendor'." });
        }

        const exist = await userModel.findOne({ email });
        if (exist) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        const phoneExist = await userModel.findOne({ "contactInfo.phone": phone });
        if (phoneExist) {
            return res.status(400).json({ success: false, message: "Phone number already exists" });
        }

        if (!validator.isMobilePhone(phone)) {
            return res.status(400).json({ success: false, message: "Invalid phone number" });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Invalid Email" });
        }

        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new userModel({
            name,
            email,
            password: hashedPassword,
            role,
            contactInfo: { phone, address }
        });

        const user = await newUser.save();
        const token = await createToken(user._id);

        return res.status(201).json({ success: true, token, userId: user._id, role: user.role });
    } catch (error) {
        console.log("Error during registration", error);
        return res.status(500).json({ success: false, message: "Unable to register the user" });
    }
};

// ✅ Updated Login User Function
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "User does not exist" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Incorrect password" });
        }

        const token = await createToken(user._id);
        return res.status(200).json({ success: true, message: "Logged in successfully!", token, userId: user._id, role: user.role });
    } catch (error) {
        console.log("Error during login", error);
        return res.status(500).json({ success: false, message: "Unable to login" });
    }
};

export { registerUser, loginUser };
