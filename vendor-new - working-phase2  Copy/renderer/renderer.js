
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

    if (document.getElementById(`order-${order.id}`)) {
        console.warn(`Order ${order.id} already exists in UI, skipping duplicate.`);
        return;
    }

    createOrderCard(order);
});

// Creates and appends a new order card
function createOrderCard(order) {
    const orderItem = document.createElement("div");
    orderItem.id = `order-${order.id}`;
    orderItem.classList.add("order-card");

    orderItem.innerHTML = `
        <h3>📌 Order ID: ${order.id}</h3>
        <p><strong>👤 Customer:</strong> ${order.customer}</p>
        <p><strong>📄 File:</strong> ${order.file}</p>
        <div class="button-group">
            <button class="accept-btn">✅ Accept</button>
            <button class="reject-btn">❌ Reject</button>
        </div>
    `;

    const acceptBtn = orderItem.querySelector(".accept-btn");
    const rejectBtn = orderItem.querySelector(".reject-btn");

    // Accept Order
    acceptBtn.addEventListener("click", async () => {
        console.log(`Order ${order.id} accepted.`);

        const printers = await window.electron.getPrinters();
        if (!printers.length) {
            alert("No printers available.");
            return;
        }

        // Open printer selection modal
        const selectedPrinter = await selectPrinter(printers);
        if (!selectedPrinter) return;

        window.electron.acceptOrder(order, selectedPrinter);
        orderItem.classList.add("order-accepted");
        setTimeout(() => orderItem.remove(), 1000); // Smooth removal
    });

    // Reject Order
    rejectBtn.addEventListener("click", () => {
        console.log(`Order ${order.id} rejected.`);
        window.electron.rejectOrder(order);
        orderItem.classList.add("order-rejected");
        setTimeout(() => orderItem.remove(), 500);
    });

    orderList.appendChild(orderItem);
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
