import productModel from '../models/product.model.js'
import userModel from '../models/user.model.js'
export const showProducts = async (req, res) => {
    try {
        const products = await productModel.find();
        if (products.length <= 0) {
            return res.status(500).json({ success: false, message: "currently there are no products present" })
        }
        return res.status(201).json({ success: true, products })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "error while fetching the products" });
    }
}
export const addProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            brand,
            category,
            subCategory,
            price,
            discount,
            sizes,
            inventory,
            images,
        } = req.body;

        // Validation: Check if required fields are present
        if (!name || !description || !brand || !category || !subCategory || !price || !sizes || !inventory || !images) {
            return res.status(400).json({ message: "All required fields must be provided!" });
        }

        // Validation: Check if the category is valid
        if (!["Men", "Women", "Kids"].includes(category)) {
            return res.status(400).json({ message: "Invalid category provided!" });
        }

        // Validation: Ensure sizes have both `size` and `stock`
        if (!Array.isArray(sizes) || sizes.some(size => !size.size || size.stock === undefined)) {
            return res.status(400).json({ message: "Each size must have a valid size and stock!" });
        }

        // Validation: Ensure images array is valid
        if (!Array.isArray(images) || images.some(image => !image.url)) {
            return res.status(400).json({ message: "Each image must have a valid URL!" });
        }

        // Check for duplicates in the database
        const existingProduct = await productModel.findOne({
            name: name.trim(), // Match by name
            brand: brand.trim(), // Match by brand
            category, // Match by category
        });

        if (existingProduct) {
            return res.status(409).json({
                message: "A product with the same name, brand, and category already exists!",
                product: existingProduct,
            });
        }

        // Create and save the new product
        const newProduct = new productModel({
            name,
            description,
            brand,
            category,
            subCategory,
            price,
            discount: discount || 0,
            sizes,
            inventory,
            images,
        });

        await newProduct.save();
        return res.status(201).json({ message: "Product added successfully!", product: newProduct });
    } catch (error) {
        console.error("Error adding product:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Remove Product
export const removeProduct = async (req, res) => {
    try {
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ message: "Product ID must be provided!" });
        }

        const deletedProduct = await productModel.findByIdAndDelete(productId);

        if (!deletedProduct) {
            return res.status(404).json({ message: "Product not found!" });
        }

        return res.status(200).json({ message: "Product removed successfully!", product: deletedProduct });
    } catch (error) {
        console.error("Error removing product:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const addToWishlist = async (req, res) => {
    try {
        const { customerId, productId } = req.body;
        if (!customerId || !productId) {
            return res.status(400).json({ success: false, message: "Customer ID and Product ID are required!" });
        }
        const customer = await userModel.findById(customerId);
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found!" });
        }
        customer.wishList.push(productId);
        await customer.save();
        console.log("Product added to wishlist!");
        return res.status(201).json({ success: true, message: "product addded to wishlist" })
    } catch (error) {
        console.log(error);
        return res.status(501).json({ success: false, message: "failed to add product to the wishlist" })
    }
};
export const showWishList = async (req, res) => {
    try {
        const { customerId } = req.body;
        if (!customerId) {
            return res.status(400).json({ success: false, message: "Customer ID is required!" });
        }
        const customer = await userModel.findById(customerId);
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found!" });
        }
        return res.status(201).json({ success: true, wishlist: customer.wishList })
    } catch (error) {
        console.log(error);
        return res.status(501).json({ success: false, message: "failed to show products in the wishlist" })
    }
};
export const removeFromWishList = async (req, res) => {
    try {
        const { customerId, productId } = req.body;
        if (!customerId || !productId) {
            return res.status(400).json({ success: false, message: "Customer ID and Product ID are required!" });
        }

        const customer = await userModel.findById(customerId);
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found!" });
        }

        // Check if the product exists in the wishlist
        if (!customer.wishList.includes(productId)) {
            return res.status(404).json({ success: false, message: "Product not found in wishlist!" });
        }
        customer.wishList = customer.wishList.filter(id => id.toString() !== productId.toString())

        await customer.save();

        return res.status(200).json({
            success: true,
            message: "Product deleted from wishlist successfully!",
        });
    } catch (error) {
        console.log(error);
        return res.status(501).json({ success: false, message: "failed to deleted from wishlist" })
    }
};