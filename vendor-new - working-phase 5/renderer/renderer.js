
// const printerSelect = document.getElementById("printer-select");
// const orderList = document.getElementById("order-list");
// let currentOrder;

// document.addEventListener("DOMContentLoaded", () => {
//     window.electron.getPrinters()
//         .then((printers) => {
//             console.log("Renderer: Printers received:", printers);
//             printers.forEach((printer) => {
//                 const option = document.createElement("option");
//                 option.value = printer.name;
//                 option.textContent = printer.name;
//                 printerSelect.appendChild(option);
//             });
//         })
//         .catch((error) => {
//             console.error("Renderer: Failed to fetch printers:", error);
//         });

//     window.electron.onNewOrder((order) => {
//         console.log("Renderer: New order received:", order);

//         if (document.getElementById(`order-${order.id}`)) {
//             console.warn(`Order ${order.id} already exists in UI, skipping duplicate.`);
//             return;
//         }

//         // Create order element
//         const orderItem = document.createElement("div");
//         orderItem.id = `order-${order.id}`;
//         orderItem.classList.add("order-item");

//         const orderTitle = document.createElement("p");
//         orderTitle.textContent = `Order ID: ${order.id}`;

//         // Customer Name
//         const customerName = document.createElement("p");
//         customerName.textContent = `Customer: ${order.customer}`;

//         // File Name
//         const fileName = document.createElement("p");
//         fileName.textContent = `File: ${order.file}`;

//         const acceptBtn = document.createElement("button");
//         acceptBtn.textContent = "Accept";
//         acceptBtn.classList.add("accept-btn");

//         acceptBtn.addEventListener("click", async () => {
//             console.log(`Order ${order.id} accepted.`);

//             const printers = await window.electron.getPrinters();
//             if (!printers.length) {
//                 alert("No printers available.");
//                 return;
//             }

//             const printerNames = printers.map((p) => p.name);
//             const selectedPrinter = prompt(`Select printer:\n${printerNames.join("\n")}`, printerNames[0]);

//             if (!selectedPrinter || !printerNames.includes(selectedPrinter)) {
//                 console.log("Invalid printer selection, printing cancelled.");
//                 return;
//             }

//             window.electron.acceptOrder(order, selectedPrinter);
//             orderItem.remove();
//         });


//         const rejectBtn = document.createElement("button");
//         rejectBtn.textContent = "Reject";
//         rejectBtn.classList.add("reject-btn");
//         rejectBtn.addEventListener("click", () => {
//             console.log(`Order ${order.id} rejected.`);
//             window.electron.rejectOrder(order);
//             orderItem.remove();
//         });

//         orderItem.appendChild(orderTitle);
//         orderItem.appendChild(customerName);
//         orderItem.appendChild(fileName);
//         orderItem.appendChild(acceptBtn);
//         orderItem.appendChild(rejectBtn);
//         orderList.appendChild(orderItem);
//     });


//     window.electron.onOrderProcessed((response) => {
//         console.log(`Renderer: Order ${response.id} processed - ${response.status}`);
//     });
// });

const printerSelect = document.getElementById("printer-select");
const orderList = document.getElementById("order-list");

// Load available printers when DOM is ready
document.addEventListener("DOMContentLoaded", async () => {
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

    // Show a notification using details from the first order item
    sendOrderNotification(order);
    createOrderCard(order);
});

// Updated notification function to use the first item details
function sendOrderNotification(order) {
    let fileName = "N/A";
    let pages = "N/A";
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
            const doc = item.document || {};
            const options = item.printOptions || {};
            html += `
        <div class="order-item">
          <h4>Item ${index + 1}</h4>
          <p><strong>File Name:</strong> ${doc.fileName || "N/A"}</p>
          <p><strong>Pages:</strong> ${doc.pages || 1}</p>
          <p><strong>Paper Size:</strong> ${options.paperSize || "N/A"}</p>
          <p><strong>Color:</strong> ${options.color ? (options.color === "color" ? "Color" : "B/W") : "N/A"}</p>
          <p><strong>Duplex:</strong> ${options.duplex ? "Yes" : "No"}</p>
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
        const modal = document.createElement("div");
        modal.classList.add("printer-modal");
        modal.innerHTML = `
      <div class="modal-content">
        <h2>🖨️ Select Printer</h2>
        <select id="printerModalSelect">
          ${printers.map((p) => `<option value="${p.name}">${p.name}</option>`).join("")}
        </select>
        <button id="confirmPrinter">✔ Confirm</button>
      </div>
    `;
        document.body.appendChild(modal);
        document.getElementById("confirmPrinter").addEventListener("click", () => {
            const selectedPrinter = document.getElementById("printerModalSelect").value;
            document.body.removeChild(modal);
            resolve(selectedPrinter);
        });
    });
}

// Listen for order processing updates
window.electron.onOrderProcessed((response) => {
    console.log(`Renderer: Order ${response.id} processed - ${response.status}`);
});
