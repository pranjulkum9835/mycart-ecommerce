let allProducts = [];
let cart = JSON.parse(localStorage.getItem('mycart')) || [];

document.addEventListener("DOMContentLoaded", () => {
    fetchProducts();
    updateCartUI();
    updateHeaderUI(); 
    initializeSearch(); // <-- Add this new line!
});

// Fetch products from backend
async function fetchProducts() {
    try {
        const response = await fetch('/api/products');
        const data = await response.json();
        
        if (data.message === "Success") {
            allProducts = data.products;
            renderProducts(allProducts);
        }
    } catch (error) {
        console.error("Error fetching products:", error);
    }
}

// Display products into sections
function renderProducts(products) {
    const saleContainer = document.getElementById('sale-container');
    const elecContainer = document.getElementById('electronics-container');
    const fashionContainer = document.getElementById('fashion-container');
    const booksContainer = document.getElementById('books-container');
    
    if(saleContainer) saleContainer.innerHTML = '';
    if(elecContainer) elecContainer.innerHTML = '';
    if(fashionContainer) fashionContainer.innerHTML = '';
    if(booksContainer) booksContainer.innerHTML = '';

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        // RELIABLE IMAGE LINK FIX
        const displayImg = `https://picsum.photos/seed/${product.product_id + 50}/200/200`;

        // Safely escape single quotes in product names for the Add to Cart button
        const safeName = product.name.replace(/'/g, "\\'");

        card.innerHTML = `
            ${product.is_on_sale ? '<span class="sale-badge">SALE</span>' : ''}
            <a href="product.html?id=${product.product_id}">
                <img src="${displayImg}" class="product-img" alt="${product.name}">
            </a>
            <h3>${product.name}</h3>
            <div style="margin: 5px 0;"><span style="background: #16a34a; color:white; font-size:11px; padding:2px 5px; border-radius:3px;">${product.rating || 4.3} ★</span></div>
            <p style="color: #0284c7; font-weight: bold; font-size: 16px;">₹${product.price}</p>
            <button class="add-to-cart-btn" onclick="addToCart(${product.product_id}, '${safeName}', ${product.price}, event)">Add to Cart</button>
        `;

        if (product.is_on_sale && saleContainer) {
            saleContainer.appendChild(card.cloneNode(true));
        }

        if (product.category === 'Electronics' && elecContainer) {
            elecContainer.appendChild(card);
        } else if (product.category === 'Fashion' && fashionContainer) {
            fashionContainer.appendChild(card);
        } else if (product.category === 'Books' && booksContainer) {
            booksContainer.appendChild(card);
        }
    });
}

// Category filter
function filterCategory(categoryName) {
    if (categoryName === 'All') {
        renderProducts(allProducts);
    } else {
        const filtered = allProducts.filter(product => product.category === categoryName);
        renderProducts(filtered);
    }
}

// Add to Cart
function addToCart(id, name, price, event) {
    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.qty++;
    } else {
        cart.push({ id, name, price, qty: 1 });
    }
    
    localStorage.setItem('mycart', JSON.stringify(cart));
    playCartAnimation(event);
    updateCartUI();
    
    // Notify other tabs to update cart count
    window.dispatchEvent(new Event('storage'));
}

// Update Cart Badge Counter accurately
function updateCartUI() {
    cart = JSON.parse(localStorage.getItem('mycart')) || []; // Refresh from storage
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.innerText = totalItems;
    }
}
// Check login status and update the header
function updateHeaderUI() {
    const userString = localStorage.getItem('mycart_user');
    const loginBtn = document.getElementById('login-btn');
    
    if (userString && loginBtn) {
        const currentUser = JSON.parse(userString);
        
        // Change the button text to the user's name
        loginBtn.innerHTML = `Hi, ${currentUser.name.split(' ')[0]} ▾`;
        loginBtn.href = "#"; // Stop it from going to the login page
        loginBtn.style.backgroundColor = "#10b981"; // Change color to green to show logged in
        
        // Make clicking it log the user out
        loginBtn.onclick = (e) => {
            e.preventDefault();
            if (confirm("Are you sure you want to log out?")) {
                localStorage.removeItem('mycart_user');
                window.location.reload(); // Refresh the page to show the Login button again
            }
        };
    }
}

// Listen for cart changes from other tabs (like the cart page)
document.addEventListener("DOMContentLoaded", () => {
    fetchProducts();
    updateCartUI();
    updateHeaderUI(); // <-- Add this new line here!
});
// Flying Animation
function playCartAnimation(e) {
    const card = e.target.closest('.product-card');
    if (!card) return;
    const img = card.querySelector('.product-img');
    const cartIcon = document.getElementById('cart-icon');
    if (!img || !cartIcon) return;

    const flyingImg = img.cloneNode(true);
    flyingImg.classList.add('flying-img');
    document.body.appendChild(flyingImg);

    const imgRect = img.getBoundingClientRect();
    const cartRect = cartIcon.getBoundingClientRect();

    flyingImg.style.left = `${imgRect.left}px`;
    flyingImg.style.top = `${imgRect.top}px`;

    setTimeout(() => {
        flyingImg.style.left = `${cartRect.left}px`;
        flyingImg.style.top = `${cartRect.top}px`;
        flyingImg.style.width = '15px';
        flyingImg.style.height = '15px';
        flyingImg.style.opacity = '0';
    }, 10);

    setTimeout(() => { flyingImg.remove(); }, 800);
}
// Search Functionality
function initializeSearch() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    if (!searchInput) return;

    // The function that filters the products
    const executeSearch = () => {
        const query = searchInput.value.toLowerCase().trim();
        
        // If the search bar is empty, show all products
        if (query === "") {
            renderProducts(allProducts);
            return;
        }

        // Filter products matching the name or category
        const filteredProducts = allProducts.filter(product => 
            product.name.toLowerCase().includes(query) || 
            product.category.toLowerCase().includes(query)
        );

        renderProducts(filteredProducts);
    };

    // Trigger search when the button is clicked
    if (searchBtn) {
        searchBtn.addEventListener('click', executeSearch);
    }

    // Trigger search instantly as the user types (Real-time search!)
    searchInput.addEventListener('input', executeSearch);
}