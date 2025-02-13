import userModel from '../models/user.model.js'
import validator from 'validator'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const createToken = async (userId) => {
    try {
        return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" }); // Add token expiry
    } catch (error) {
        console.log("Token creation failed", error);
        throw new Error("Token creation failed");
    }
}
const registerUser = async (req, res) => {
    const { firstName, lastName, email, password, phone, address } = req.body;
    try {
        if (!firstName || !lastName || !email || !password || !phone || !address) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }
        const exist = await userModel.findOne({ email })
        if (exist) {
            return res.json({ succes: false, message: "User already exists" });
        }
        const phoneExist = await userModel.findOne({ phone });
        console.log(phoneExist);

        if (phoneExist) {
            return res.status(501).json({ success: false, message: "phone number already exists" })
        }
        if (!validator.isMobilePhone(phone)) {
            return res.status(400).json({ success: false, message: "Invalid phone number" });
        }
        if (!validator.isEmail(email)) {
            return res.json({ succes: false, message: "Invalid Email" });
        }
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" })
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new userModel({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            phone,
            address,

        })
        const user = await newUser.save();
        const token = await createToken(user._id)

        return res.json({ success: true, token })
    } catch (error) {
        console.log("Error during registration", error);
        return res.status(500).json({ success: false, message: "Unable to register the user" });
    }
}
const loginUser = async (req, res) => {
    try {
        const { phone, password } = req.body;
        const user = await userModel.findOne({ phone });
        if (!user) {
            return res.status(400).json({ success: false, message: "user does not exist" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Incorrect password" })
        }
        const token = await createToken(user._id)
        return res.status(200).json({ sucess: true, message: "Logged in successfully !", token })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Unable to login" });
    }
}

export { registerUser, loginUser }