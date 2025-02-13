import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "electron/orders.json");

export function storeOrder(order) {
    let orders = [];
    if (fs.existsSync(filePath)) {
        orders = JSON.parse(fs.readFileSync(filePath));
    }
    orders.push(order);
    fs.writeFileSync(filePath, JSON.stringify(orders, null, 2));
}

export function getOrders() {
    if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath));
    }
    return [];
}
