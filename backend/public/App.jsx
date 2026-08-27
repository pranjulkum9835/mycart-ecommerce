document.addEventListener("DOMContentLoaded", () => {
    fetchProducts();
});

// 1. Fetch data from your backend
async function fetchProducts() {
    try {
        const response = await fetch('http://localhost:5000/api/products');
        const data = await response.json();
        
        if (data.message === "Success") {
            renderProducts(data.products);
        }
    } catch (error) {
        console.error("Error fetching products:", error);
        document.getElementById('product-container').innerHTML = "<p>Failed to load products.</p>";
    }
}

// 2. Display the products on the screen
function renderProducts(products) {
    const container = document.getElementById('product-container');
    container.innerHTML = ''; // Clear the "Loading..." text

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        // Using a placeholder image for now
        card.innerHTML = `
            <img src="https://via.placeholder.com/150" class="product-img" alt="${product.name}">
            <h3>${product.name}</h3>
            <p style="color: #388e3c; font-weight: bold;">₹${product.price}</p>
            <button class="add-to-cart-btn">Add to Cart</button>
        `;
        container.appendChild(card);
    });

    // Attach the animation logic to the new buttons
    attachCartAnimation();
}

// 3. The Cart Animation
let cartCount = 0;
function attachCartAnimation() {
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            const card = e.target.closest('.product-card');
            const img = card.querySelector('.product-img');
            const cart = document.getElementById('cart-icon');

            const flyingImg = img.cloneNode(true);
            flyingImg.classList.add('flying-img');
            document.body.appendChild(flyingImg);

            const imgRect = img.getBoundingClientRect();
            const cartRect = cart.getBoundingClientRect();

            flyingImg.style.left = `${imgRect.left}px`;
            flyingImg.style.top = `${imgRect.top}px`;

            setTimeout(() => {
                flyingImg.style.left = `${cartRect.left}px`;
                flyingImg.style.top = `${cartRect.top}px`;
                flyingImg.style.width = '10px';
                flyingImg.style.height = '10px';
                flyingImg.style.opacity = '0';
            }, 10);

            setTimeout(() => {
                flyingImg.remove();
                cartCount++;
                document.getElementById('cart-count').innerText = cartCount;
            }, 800);
        });
    });
}