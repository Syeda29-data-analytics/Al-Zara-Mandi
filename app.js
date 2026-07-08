/* -------------------------------------------------------------
   AL ZARA MANDI - JAVASCRIPT
   Handles search, category filters, order cart tray, and
   dynamic WhatsApp link compilation.
------------------------------------------------------------- */

// Configuration
const WHATSAPP_NUMBER = "919343123451"; // International format without +

// State
let cart = [];

// DOM Elements
const header = document.getElementById('main-header');
const menuToggle = document.getElementById('menu-toggle');
const navMenu = document.getElementById('nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

const searchInput = document.getElementById('menu-search');
const filterBtns = document.querySelectorAll('.filter-btn');
const menuCards = document.querySelectorAll('.menu-card');

const cartTrigger = document.getElementById('cart-trigger');
const drawer = document.getElementById('order-tray-drawer');
const drawerClose = document.getElementById('drawer-close');
const trayEmpty = document.getElementById('tray-empty');
const trayItemsList = document.getElementById('tray-items-list');
const drawerFooter = document.getElementById('drawer-footer');
const summaryTotal = document.getElementById('summary-total');
const cartBadge = document.getElementById('cart-badge');
const btnWhatsappOrderTotal = document.getElementById('btn-whatsapp-order-total');

// Floating Mobile Bar
const mobileBar = document.getElementById('floating-mobile-bar');
const mobileBarCount = document.getElementById('mobile-bar-count');
const mobileBarPrice = document.getElementById('mobile-bar-price');
const btnMobileCheckout = document.getElementById('btn-mobile-checkout');

// Initialize Website
document.addEventListener('DOMContentLoaded', () => {
    initScrollHeader();
    initMobileNav();
    initFiltering();
    initCart();
    initSingleOrderButtons();
});

/* -------------------------------------------------------------
   SCROLL & NAVIGATION EFFECTS
------------------------------------------------------------- */
function initScrollHeader() {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        // Update active navigation link on scroll
        let current = "";
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

function initMobileNav() {
    // Menu toggle
    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('open');
        const icon = menuToggle.querySelector('i');
        if (navMenu.classList.contains('open')) {
            icon.className = 'fa-solid fa-xmark';
        } else {
            icon.className = 'fa-solid fa-bars';
        }
    });

    // Close menu when link clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('open');
            menuToggle.querySelector('i').className = 'fa-solid fa-bars';
        });
    });
}

/* -------------------------------------------------------------
   MENU FILTERING & SEARCH
------------------------------------------------------------- */
function initFiltering() {
    // Category Tabs Filter
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            filterMenu();
        });
    });

    // Search Input Filter
    searchInput.addEventListener('input', filterMenu);
}

function filterMenu() {
    const activeCategory = document.querySelector('.filter-btn.active').dataset.filter;
    const searchQuery = searchInput.value.toLowerCase().trim();

    menuCards.forEach(card => {
        const category = card.dataset.category;
        const name = card.dataset.name;
        const desc = card.querySelector('.dish-desc').textContent.toLowerCase();
        
        const matchesCategory = (activeCategory === 'all' || category === activeCategory);
        const matchesSearch = (name.includes(searchQuery) || desc.includes(searchQuery));

        if (matchesCategory && matchesSearch) {
            card.style.display = 'flex';
            // Trigger quick layout fade in
            card.style.opacity = '0';
            card.style.transform = 'scale(0.95)';
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'scale(1)';
            }, 50);
        } else {
            card.style.display = 'none';
        }
    });
}

/* -------------------------------------------------------------
   WHATSAPP MESSAGE COMPILER FOR SINGLE CARD CLICKS
------------------------------------------------------------- */
function initSingleOrderButtons() {
    const orderNowLinks = document.querySelectorAll('.btn-card-whatsapp');
    orderNowLinks.forEach(link => {
        const dishName = link.dataset.name;
        // Construct pre-filled message: "hi, I would like to order [Dish Name] from Al Zara Mandi!"
        const messageText = `hi, I would like to order ${dishName} from Al Zara Mandi! Please confirm.`;
        const encodedText = encodeURIComponent(messageText);
        link.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedText}`;
    });
}

/* -------------------------------------------------------------
   CART & ORDER TRAY DRAWER LOGIC
------------------------------------------------------------- */
function initCart() {
    // Open Drawer
    cartTrigger.addEventListener('click', () => drawer.classList.add('open'));
    btnMobileCheckout.addEventListener('click', () => drawer.classList.add('open'));
    
    // Close Drawer
    drawerClose.addEventListener('click', () => drawer.classList.remove('open'));
    
    // Close drawer when clicking outside (on main website)
    document.addEventListener('click', (e) => {
        if (!drawer.contains(e.target) && !cartTrigger.contains(e.target) && !mobileBar.contains(e.target) && drawer.classList.contains('open')) {
            // Make sure we aren't clicking on a "Add to Tray" button which also interacts with the drawer
            if (!e.target.closest('.btn-add-tray')) {
                drawer.classList.remove('open');
            }
        }
    });

    // Add items from menu cards
    const addBtns = document.querySelectorAll('.btn-add-tray');
    addBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.dataset.id;
            const name = btn.dataset.name;
            const price = parseInt(btn.dataset.price);
            
            addToCart(id, name, price);
            
            // Visual micro-feedback on button
            const icon = btn.querySelector('i');
            icon.className = 'fa-solid fa-check';
            btn.style.backgroundColor = 'var(--gold-primary)';
            btn.style.color = 'var(--bg-main)';
            
            setTimeout(() => {
                icon.className = 'fa-solid fa-plus';
                btn.style.backgroundColor = '';
                btn.style.color = '';
            }, 1000);
            
            // Auto open cart tray on first item added to wow the user
            if (cart.length === 1 && cart[0].qty === 1) {
                setTimeout(() => {
                    drawer.classList.add('open');
                }, 300);
            }
        });
    });

    // Checkout Multi-item via WhatsApp
    btnWhatsappOrderTotal.addEventListener('click', sendMultiItemWhatsAppOrder);
}

function addToCart(id, name, price) {
    const existingIndex = cart.findIndex(item => item.id === id);
    
    if (existingIndex > -1) {
        cart[existingIndex].qty += 1;
    } else {
        cart.push({ id, name, price, qty: 1 });
    }
    
    updateCartUI();
}

function updateCartUI() {
    // 1. Badge count
    const totalItemsCount = cart.reduce((total, item) => total + item.qty, 0);
    cartBadge.textContent = totalItemsCount;
    
    // 2. Clear listing
    trayItemsList.innerHTML = '';
    
    if (cart.length === 0) {
        trayEmpty.style.display = 'flex';
        drawer.classList.remove('has-items');
        mobileBar.classList.remove('visible');
        return;
    }
    
    // Show cart items
    trayEmpty.style.display = 'none';
    drawer.classList.add('has-items');
    
    let subtotal = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.qty;
        subtotal += itemTotal;
        
        const itemEl = document.createElement('div');
        itemEl.className = 'tray-item';
        itemEl.innerHTML = `
            <div class="tray-item-info">
                <div class="tray-item-title">${item.name}</div>
                <div class="tray-item-price">₹${item.price} <span class="text-muted">x ${item.qty}</span></div>
            </div>
            <div class="tray-item-controls">
                <button class="btn-qty btn-minus" data-id="${item.id}" aria-label="Decrease Quantity">
                    <i class="fa-solid fa-minus"></i>
                </button>
                <span class="qty-val">${item.qty}</span>
                <button class="btn-qty btn-plus" data-id="${item.id}" aria-label="Increase Quantity">
                    <i class="fa-solid fa-plus"></i>
                </button>
            </div>
        `;
        
        trayItemsList.appendChild(itemEl);
    });
    
    summaryTotal.textContent = `₹${subtotal}`;
    
    // Setup quantity buttons listeners
    const minusBtns = trayItemsList.querySelectorAll('.btn-minus');
    const plusBtns = trayItemsList.querySelectorAll('.btn-plus');
    
    minusBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            changeQty(id, -1);
        });
    });
    
    plusBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            changeQty(id, 1);
        });
    });
    
    // 3. Floating Mobile Action Bar
    mobileBarCount.textContent = `${totalItemsCount} item${totalItemsCount > 1 ? 's' : ''}`;
    mobileBarPrice.textContent = `₹${subtotal}`;
    mobileBar.classList.add('visible');
}

function changeQty(id, delta) {
    const itemIndex = cart.findIndex(item => item.id === id);
    if (itemIndex > -1) {
        cart[itemIndex].qty += delta;
        if (cart[itemIndex].qty <= 0) {
            cart.splice(itemIndex, 1);
        }
        updateCartUI();
    }
}

function sendMultiItemWhatsAppOrder() {
    if (cart.length === 0) return;
    
    // Construct beautiful message
    let messageText = `hi, I would like to place an order from Al Zara Mandi!\n\n`;
    let subtotal = 0;
    
    cart.forEach(item => {
        const itemCost = item.price * item.qty;
        subtotal += itemCost;
        messageText += `• ${item.qty}x ${item.name} (₹${item.price} each)\n`;
    });
    
    messageText += `\n*Total Amount:* ₹${subtotal}\n`;
    messageText += `*Outlet:* Frazer Town, Coles Road\n\n`;
    messageText += `Please confirm my order and let me know the estimated delivery time. Thanks!`;
    
    const encodedText = encodeURIComponent(messageText);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedText}`;
    
    window.open(whatsappUrl, '_blank');
}
