import keytar from "keytar";
import axios from "axios";

const SERVICE_NAME = "autoprintx"; // Secure storage name
const ACCOUNT_NAME = "vendor_token"; // Key for JWT

async function loginVendor(email, password) {
    try {
        const response = await axios.post("http://localhost:3000/api/auth/login", { email, password });
        const token = response.data.token; // Assume JWT is returned

        if (token) {
            await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, token); // Store JWT securely
            return { success: true };
        }
    } catch (error) {
        console.error("Login failed:", error.message);
        return { success: false, error: error.message };
    }
}

async function getAuthToken() {
    return await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
}

// 🔥 FIXED: Now correctly uses the `endpoint` parameter
async function makeAuthenticatedRequest(endpoint, method = "GET", data = {}) {
    try {
        const token = await getAuthToken();
        if (!token) throw new Error("No token found. Please log in.");

        const response = await axios({
            url: `http://localhost:3000${endpoint}`, // 🔥 FIXED ENDPOINT
            method,
            headers: { Authorization: `Bearer ${token}` },
            data,
        });

        return response.data;
    } catch (error) {
        console.error("Request failed:", error.message);
        return null;
    }
}

async function logoutVendor() {
    try {
        await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
        console.log("Token cleared successfully");
        return true;
    } catch (error) {
        console.error("Failed to clear token:", error);
        return false;
    }
}


export { loginVendor, getAuthToken, makeAuthenticatedRequest, logoutVendor };
