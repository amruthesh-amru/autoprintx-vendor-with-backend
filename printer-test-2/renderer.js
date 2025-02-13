const socket = window.electronAPI.connectToSocket('http://localhost:5000');
const ordersContainer = document.getElementById('orders');

socket.on('new-order', (order) => {
    const orderElement = document.createElement('div');
    orderElement.innerHTML = `
        <p>Order ID: ${order.id}</p>
        <p>Document: ${order.document}</p>
        <button class="accept">Accept</button>
        <button class="reject">Reject</button>
    `;

    orderElement.querySelector('.accept').addEventListener('click', () => {
        const printerName = prompt('Enter printer name:');
        if (printerName) {
            window.electronAPI.printDocument({
                documentPath: `assets/${order.document}`,
                printerName,
                paperSize: order.paperSize,
                side: order.side,
                copies: order.copies,
                monochrome: order.monochrome,
                range: order.range,
            }).then((result) => {
                if (result.success) {
                    alert('Print job sent successfully.');
                    socket.emit('order-accepted', order.id);
                    orderElement.remove();
                } else {
                    alert(`Print job failed: ${result.error}`);
                }
            });
        }
    });

    orderElement.querySelector('.reject').addEventListener('click', () => {
        socket.emit('order-rejected', order.id);
        orderElement.remove();
    });

    ordersContainer.appendChild(orderElement);
});
