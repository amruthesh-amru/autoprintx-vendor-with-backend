import express from 'express';
import upload from '../middlewares/upload.js'; // Adjust path if needed
import { processOrder } from '../controllers/order.controller.js';

const router = express.Router();

// The client will send the file using the field name "file"
// and include an "id" field in the body for naming.
router.post('/upload', upload.single('file'), processOrder);

export default router;
