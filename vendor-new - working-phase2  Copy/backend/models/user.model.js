import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    address:
    {
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: String
    },
    wishList: [{ type: mongoose.Schema.Types.ObjectId, ref: "product" }],
    cartData: {
        type: Object,
        default: {}
    }
    // createdAt: { type: Date, default: Date.now },
    // updatedAt: { type: Date, default: Date.now },
},
    { timestamps: true },
)

export default mongoose.model("Customer", UserSchema);