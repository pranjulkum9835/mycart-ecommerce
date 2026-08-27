document.addEventListener("DOMContentLoaded", () => {
    const pincodeInput = document.getElementById('pincode');
    const cityInput = document.getElementById('city');
    const stateInput = document.getElementById('state');
    const pinStatus = document.getElementById('pin-status');

    // Listen for typing in the pincode field
    pincodeInput.addEventListener('input', async function(e) {
        const pin = e.target.value;

        // Only trigger the API if exactly 6 digits are entered
        if (pin.length === 6) {
            try {
                // Fetch data from the free Indian Postal API
                const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
                const data = await response.json();
                
                if (data[0].Status === "Success") {
                    // Success! Extract the post office data
                    const postOffice = data[0].PostOffice[0];
                    
                    // Auto-fill the fields
                    cityInput.value = postOffice.District;
                    stateInput.value = postOffice.State;
                    
                    // Hide any previous error messages
                    pinStatus.style.display = 'none';
                } else {
                    // Pincode not found
                    cityInput.value = '';
                    stateInput.value = '';
                    pinStatus.style.display = 'block';
                    pinStatus.innerText = "Pincode not found";
                }
            } catch (error) {
                console.error("Error fetching pincode data:", error);
            }
        } else {
            // Clear fields if the user deletes digits
            cityInput.value = '';
            stateInput.value = '';
            pinStatus.style.display = 'none';
        }
    });

    // Handle form submission
   document.getElementById('checkout-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // 1. Ask backend to create an order
    const response = await fetch('http://localhost:5000/api/create-payment', { method: 'POST' });
    const data = await response.json();

    if (data.message === "Success") {
        // 2. Configure the Razorpay popup
        const options = {
            "key": "rzp_test_YourKeyIdHere", // Enter your test key here too
            "amount": data.order.amount,
            "currency": "INR",
            "name": "MyCart",
            "description": "Test Transaction",
            "order_id": data.order.id,
            "handler": function (response){
                // 3. What happens after successful payment!
                alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`);
                // Here, you would usually redirect them to a "Thank You" page
                window.location.href = "index.html"; 
            },
            "prefill": {
                "name": document.getElementById('name').value,
                "contact": "9999999999" // You can add a phone input to your form later
            },
            "theme": {
                "color": "#2874f0" // Flipkart Blue
            }
        };

        // Open the payment window
        const rzp1 = new Razorpay(options);
        rzp1.open();
    }
});
});