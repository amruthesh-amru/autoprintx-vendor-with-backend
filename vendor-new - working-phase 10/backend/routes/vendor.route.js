import express from "express";
import { signupVendor, loginVendor } from "../controllers/vendor.controller.js";

const router = express.Router();

// Signup route
router.post("/signup", signupVendor);
router.post("/login", loginVendor);

export default router;
