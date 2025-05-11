// pastOrdersRenderer.js

async function loadPastOrders() {
    try {
        const response = await fetch("http://localhost:3000/api/order/getOrders");
        // const response = await fetch("https://autoprint-x-backend-deploy.onrender.com/api/order/getOrders");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const orders = data.orders || [];
        const pastOrdersContainer = document.getElementById("past-orders");
        pastOrdersContainer.innerHTML = ""; // Clear previous content

        if (orders.length === 0) {
            pastOrdersContainer.innerHTML = "<p>No past orders found.</p>";
            return;
        }

        orders.forEach((order) => {
            const orderCard = document.createElement("div");
            orderCard.classList.add("order-card");
            orderCard.innerHTML = `
          <h3>📌 Order ID: ${order._id}</h3>
          <p><strong>👤 Customer:</strong> ${order.customer}</p>
          <p><strong>💰 Cost Estimate:</strong> ₹${order.costEstimate}</p>
          <p><strong>🕒 Created At:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
        `;
            pastOrdersContainer.appendChild(orderCard);
        });
    } catch (error) {
        console.error("Error fetching past orders:", error);
        const pastOrdersContainer = document.getElementById("past-orders");
        pastOrdersContainer.innerHTML = `<p>Error loading orders: ${error.message}</p>`;
    }
}

// Attach event listener to back button to navigate back to dashboard
document.getElementById("back-to-dashboard").addEventListener("click", () => {
    window.location.href = "index.html"; // Adjust if your dashboard page has a different name/path
});

// Load past orders once the DOM is fully loaded
document.addEventListener("DOMContentLoaded", loadPastOrders);
