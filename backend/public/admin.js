document.addEventListener("DOMContentLoaded", fetchOrders);

async function fetchOrders() {
    try {
        const response = await fetch('http://localhost:5000/api/admin/orders');
        const data = await response.json();
        
        if (data.message === "Success") {
            renderOrders(data.orders);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

function renderOrders(orders) {
    const tbody = document.getElementById('orders-table-body');
    tbody.innerHTML = '';

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">No orders found.</td></tr>';
        return;
    }

    orders.forEach(order => {
        const tr = document.createElement('tr');
        
        // Generate table rows dynamically
        tr.innerHTML = `
            <td>#000${order.order_id}</td>
            <td>₹${order.total_amount}</td>
            <td><span class="status-${order.status}">${order.status.toUpperCase()}</span></td>
            <td>
                ${order.status === 'pending' 
                    ? `<button class="btn-ship" onclick="markAsShipped(${order.order_id})">Mark as Shipped</button>` 
                    : 'Dispatched 🚚'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Function to update the database when you click the button
async function markAsShipped(orderId) {
    try {
        const response = await fetch(`http://localhost:5000/api/admin/orders/${orderId}/ship`, { method: 'POST' });
        const data = await response.json();
        
        if (data.message === "Order updated successfully") {
            // Refresh the table to show the new status
            fetchOrders(); 
        }
    } catch (error) {
        console.error("Error updating order:", error);
    }
}