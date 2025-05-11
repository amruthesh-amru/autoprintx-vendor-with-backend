const printerSelect = document.getElementById("printer-select");
const orderList = document.getElementById("order-list");
const logoutButton = document.getElementById("logout-btn");
// Load available printers when DOM is ready
document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("vendorToken");

    if (!token) {
        console.log("No token found! Redirecting to login...");
        window.location.href = "login.html"; // Redirect to login page
    } else {
        console.log("User authenticated!");
        // You can also make an API request here to validate the token if needed
    }


    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            window.electron.logoutVendor(); // This sends the logout request to the main process
            localStorage.removeItem("vendorToken"); // Optionally clear localStorage too
            alert("Logged out!");
            window.location.href = "login.html";
        });
    }
    try {
        const printers = await window.electron.getPrinters();
        console.log("Renderer: Printers received:", printers);

        if (printers.length === 0) {
            printerSelect.innerHTML = "<option disabled>No Printers Available</option>";
            return;
        }

        printers.forEach((printer) => {
            const option = document.createElement("option");
            option.value = printer.name;
            option.textContent = printer.name;
            printerSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Renderer: Failed to fetch printers:", error);
    }
    try {
        const storedOrders = await window.electron.getOrders();
        console.log("Renderer: Stored orders:", storedOrders);
        storedOrders.forEach((order) => {
            // Avoid duplicates if necessary
            if (!document.getElementById(`order-${order._id}`)) {
                createOrderCard(order);
            }
        });
    } catch (error) {
        console.error("Renderer: Failed to load stored orders:", error);
    }
});


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
        console.error("Renderer: Failed to fetch past orders", error);
    }
}


document.addEventListener("DOMContentLoaded", () => {
    const showPastOrdersBtn = document.getElementById("show-past-orders");
    showPastOrdersBtn.addEventListener("click", loadPastOrders);
});

// Listen for new orders
window.electron.onNewOrder((order) => {
    console.log("Renderer: New order received:", order);

    // Check for order ID
    const orderId = order._id || order.id;
    if (!orderId) {
        console.error("Error: Order ID is missing, skipping.");
        return;
    }

    // Avoid duplicate entries
    if (document.getElementById(`order-${orderId}`)) {
        console.warn(`Order ${orderId} already exists in UI, skipping duplicate.`);
        return;
    }
    console.log("Triggering Notification for Order:", order)
    // Show a notification using details from the first order item
    sendOrderNotification(order);
    createOrderCard(order);
});

// Updated notification function to use the first item details
function sendOrderNotification(order) {
    let fileName = order.items[0].document.fileName;
    let pages = order.items[0].document.pages;
    if (order.items && order.items.length > 0) {
        const firstItem = order.items[0];
        fileName = firstItem.document && firstItem.document.fileName ? firstItem.document.fileName : "N/A";
        pages = firstItem.document && firstItem.document.pages ? firstItem.document.pages : "N/A";
    }

    if (Notification.permission === "granted") {
        const notification = new Notification("🖨 New Print Order", {
            body: `Order ID: ${order._id}\nFile: ${fileName}\nPages: ${pages}`,
            icon: "icon.png", // Optional: Add an icon
        });

        notification.onclick = () => {
            window.electron.restoreApp();
        };
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
                sendOrderNotification(order);
            }
        });
    }
}

// Updated createOrderCard that iterates over order.items
function createOrderCard(order) {
    const orderId = order._id || order.id;
    if (!orderId) {
        console.error("Error: Order ID is missing, skipping.");
        return;
    }

    const orderCard = document.createElement("div");
    orderCard.id = `order-${orderId}`;
    orderCard.classList.add("order-card");

    let html = `
    <h3>📌 Order ID: ${orderId}</h3>
    <p><strong>👤 Customer:</strong> ${order.customer}</p>
    <p><strong>💰 Cost Estimate:</strong> ₹${order.costEstimate}</p>
    <p><strong>🕒 Created At:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
    <hr/>
  `;

    if (order.items && order.items.length > 0) {
        order.items.forEach((item, index) => {
            console.log(item);

            const doc = item.document || {};
            const options = item.printOptions || {};
            html += `
        <div class="order-item">
          <h4>Item ${index + 1}</h4>
          <p><strong>File Name:</strong> ${doc.fileName || "N/A"}</p>
          
          <p><strong>Paper Size:</strong> ${options.paperSize || "N/A"}</p>
          <p><strong>Color:</strong> ${options.color ? (options.color === "color" ? "Color" : "B/W") : "N/A"}</p>
          <p><strong>Duplex:</strong> ${options.duplex ? "Yes" : "No"}</p>
          <p><strong>All Page Print:</strong> ${options.selectAll ? "Yes" : "No"}</p>
          <p><strong>Page Range:</strong> ${options.pageRange ? options.pageRange : "No"}</p>
          <p><strong>Copies:</strong> ${options.copies || 1}</p>
          <p><strong>Binding:</strong> ${options.binding || "none"}</p>
        </div>
        <hr/>
      `;
        });
    } else {
        html += `<p>No items in order.</p>`;
    }

    html += `
    <div class="button-group">
      <button class="accept-btn">✅ Accept</button>
      <button class="reject-btn">❌ Reject</button>
    </div>
  `;

    orderCard.innerHTML = html;

    const acceptBtn = orderCard.querySelector(".accept-btn");
    const rejectBtn = orderCard.querySelector(".reject-btn");

    acceptBtn.addEventListener("click", async () => {
        console.log(`Order ${orderId} accepted.`);
        const printers = await window.electron.getPrinters();
        if (!printers.length) {
            alert("No printers available.");
            return;
        }
        const selectedPrinter = await selectPrinter(printers);
        if (!selectedPrinter) return;
        window.electron.acceptOrder(order, selectedPrinter);
        orderCard.classList.add("order-accepted");
        setTimeout(() => orderCard.remove(), 1000);
    });

    rejectBtn.addEventListener("click", () => {
        console.log(`Order ${orderId} rejected.`);
        window.electron.rejectOrder(order);
        orderCard.classList.add("order-rejected");
        setTimeout(() => orderCard.remove(), 500);
    });

    if (orderList) {
        orderList.appendChild(orderCard);
    } else {
        console.error("Order list element not found.");
    }
}

// Printer selection modal
async function selectPrinter(printers) {
    return new Promise((resolve) => {
        // Create the modal container using the class defined in your CSS
        const modal = document.createElement("div");
        modal.classList.add("printer-modal");

        // Set up modal content using the CSS class
        modal.innerHTML = `
        <div class="modal-content">
          <h2>🖨️ Select Printer</h2>
          <select id="printerModalSelect">
            ${printers.map((p) => `<option value="${p.name}">${p.name}</option>`).join("")}
          </select>
          <div class="modal-buttons">
            <button id="confirmPrinter">✔ Confirm</button>
            <button id="cancelPrinter">✖ Cancel</button>
          </div>
        </div>
      `;

        document.body.appendChild(modal);

        // Set up event listeners
        const confirmBtn = document.getElementById("confirmPrinter");
        const cancelBtn = document.getElementById("cancelPrinter");

        confirmBtn.addEventListener("click", () => {
            const selectedPrinter = document.getElementById("printerModalSelect").value;
            document.body.removeChild(modal);
            resolve(selectedPrinter);
        });

        cancelBtn.addEventListener("click", () => {
            document.body.removeChild(modal);
            resolve(null);
        });
    });
}



// Listen for order processing updates
window.electron.onOrderProcessed((response) => {
    console.log(`Renderer: Order ${response.id} processed - ${response.status}`);
});
