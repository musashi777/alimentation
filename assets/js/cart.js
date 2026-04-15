/**
 * ARCHITECTURE MODULAIRE O(1) - CART.JS (A 'LIM G)
 * Sépare la logique de données (Store), de l'affichage (UI) et de l'état (App)
 */

const Store = {
    items: new Map(), // Table de hachage O(1) pour l'accès aux données
    total: 0,
    config: {
        whatsappNumber: "33600000000",
        storageKey: 'alimentation_cart'
    },

    load() {
        const saved = localStorage.getItem(this.config.storageKey);
        if (saved) {
            try {
                this.items = new Map(Object.entries(JSON.parse(saved)));
            } catch (e) { this.items = new Map(); }
        }
    },

    save() {
        localStorage.setItem(this.config.storageKey, JSON.stringify(Object.fromEntries(this.items)));
    },

    add(id, name, price) {
        if (this.items.has(id)) {
            this.items.get(id).quantity += 1;
        } else {
            this.items.set(id, { name, price, quantity: 1 });
        }
        this.save();
    },

    decrease(id) {
        if (this.items.has(id)) {
            const item = this.items.get(id);
            item.quantity -= 1;
            if (item.quantity <= 0) this.items.delete(id);
            this.save();
        }
    },

    remove(id) {
        this.items.delete(id);
        this.save();
    },

    getSummary() {
        let total = 0;
        const cartArray = [];
        this.items.forEach((item, id) => {
            total += item.price * item.quantity;
            cartArray.push({ id, ...item });
        });
        return { cartArray, total };
    }
};

const UI = {
    renderProducts(products) {
        const grouped = products.reduce((acc, p) => {
            if (!acc[p.category]) acc[p.category] = [];
            acc[p.category].push(p);
            return acc;
        }, {});

        Object.entries(grouped).forEach(([cat, items]) => {
            const sectionId = `rayon-${this.slugify(cat)}`;
            const section = document.getElementById(sectionId);
            if (!section) return;

            const grid = section.querySelector('.product-grid');
            if (grid) {
                // Animation de fondu : on remplace les skeletons par les produits
                grid.style.opacity = '0';
                grid.innerHTML = items.map(p => this.productTemplate(p)).join('');
                setTimeout(() => grid.style.opacity = '1', 50);
            }
        });
    },

    slugify: (s) => s.toLowerCase()
        .replace(/[🍹🍺🍟🍦🔥\s]/g, '-')
        .replace(/-+/g, '-')
        .normalize("NFD").replace(/[\u0300-\u036f]/g, ""),

    productTemplate: (p) => `
        <div class="product-card" data-id="${p.id}">
            ${p.tag ? `<span class="badge">${p.tag}</span>` : ''}
            <div class="product-image" style="background-image: url('${p.image}')"></div>
            <div class="product-info">
                <h3>${p.name}</h3>
                ${p.description ? `<p class="description">${p.description}</p>` : ''}
                <p class="price">${p.price.toFixed(2)}€ / ${p.unite}</p>
                <button class="add-to-cart" 
                        onclick="App.addToCart('${p.id}', '${p.name}', ${p.price})">
                    Ajouter
                </button>
            </div>
        </div>
    `,

    updateCartUI() {
        const { cartArray, total } = Store.getSummary();
        const list = document.getElementById('cart-items');
        const totalEl = document.getElementById('total-price');
        const badge = document.getElementById('cart-count');
        const emptyState = document.getElementById('empty-cart');

        // Gestion de l'état vide
        if (emptyState) emptyState.classList.toggle('hidden', cartArray.length > 0);

        if (list) {
            list.innerHTML = cartArray.map(i => `
                <li class="cart-item">
                    <div class="cart-item-info">
                        <span class="cart-item-name">${i.name}</span>
                        <span class="cart-item-price">${(i.price * i.quantity).toFixed(2)}€</span>
                    </div>
                    <div class="qty-controls">
                        <button class="qty-btn" onclick="App.updateQty('${i.id}', -1)">−</button>
                        <span>${i.quantity}</span>
                        <button class="qty-btn" onclick="App.updateQty('${i.id}', 1)">+</button>
                    </div>
                </li>
            `).join('');
        }
        if (totalEl) totalEl.textContent = total.toFixed(2);
        if (badge) badge.textContent = cartArray.reduce((acc, i) => acc + i.quantity, 0);
    },

    updateStatus() {
        const now = new Date();
        const hour = now.getHours();
        const day = now.getDay(); 
        
        const statusEl = document.getElementById('status-indicator');
        const statusText = document.getElementById('status-text');
        if (!statusEl || !statusText) return;

        let isOpen = false;
        let closingTime = (day === 5 || day === 6) ? "02:00" : "22:00";

        if (day === 5 || day === 6) {
            if (hour >= 10 || hour < 2) isOpen = true;
        } else {
            if (hour >= 10 && hour < 22) isOpen = true;
        }

        statusEl.className = isOpen ? "status-online" : "status-offline";
        statusText.textContent = isOpen ? `Ouvert • Ferme à ${closingTime}` : "Fermé • Ouvre à 10:00";
    },

    showToast(msg) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
    }
};

const App = {
    async init() {
        Store.load();
        UI.updateCartUI();
        UI.updateStatus();
        this.bindEvents();
        this.checkAgeGate();
        this.initScrollSpy();
        this.registerServiceWorker();
        await this.loadProducts();
    },

    initScrollSpy() {
        const sections = document.querySelectorAll('.category-section');
        const navLinks = document.querySelectorAll('.filter-btn');

        const observerOptions = {
            root: null,
            rootMargin: '-150px 0px -50% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    navLinks.forEach(link => {
                        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                    });
                }
            });
        }, observerOptions);

        sections.forEach(section => observer.observe(section));
    },

    updateQty(id, delta) {
        if (delta > 0) Store.add(id);
        else Store.decrease(id);
        UI.updateCartUI();
    },

    async loadProducts() {
        // Tentative de chargement via API (Airtable)
        try {
            const res = await fetch('/api/products');
            if (res.ok) {
                const products = await res.json();
                UI.renderProducts(products);
                return; // Succès API
            }
            throw new Error("API Indisponible");
        } catch (e) {
            console.warn("Mode Fallback : Utilisation des données locales Hugo");
            // Si l'API échoue, on utilise les données injectées par Hugo (O(1) car déjà en mémoire)
            if (window.HUGO_PRODUCTS && window.HUGO_PRODUCTS.length > 0) {
                UI.renderProducts(window.HUGO_PRODUCTS);
            } else {
                UI.showToast("Erreur de chargement des produits");
            }
        }
    },

    addToCart(id, name, price) {
        Store.add(id, name, price);
        UI.updateCartUI();
        UI.showToast(`${name} ajouté !`);
        document.getElementById('cart-summary')?.classList.remove('cart-hidden');
    },

    checkAgeGate() {
        const hasConsented = localStorage.getItem('age_consented');
        const ageGate = document.getElementById('age-gate');
        if (hasConsented) return;
        
        ageGate?.classList.remove('modal-hidden');
        document.getElementById('age-confirm')?.addEventListener('click', () => {
            localStorage.setItem('age_consented', 'true');
            ageGate?.classList.add('modal-hidden');
        });
        document.getElementById('age-deny')?.addEventListener('click', () => {
            window.location.href = 'https://www.google.com';
        });
    },

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
        }
    },

    async sendOrder() {
        const orderType = document.querySelector('input[name="order-type"]:checked')?.value;
        const address = document.getElementById('delivery-address')?.value;
        const { cartArray, total } = Store.getSummary();

        if (orderType === 'delivery' && !address) {
            UI.showToast("Merci d'indiquer votre adresse !");
            return;
        }

        try {
            const res = await fetch('/api/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cart: cartArray, total, orderType, address })
            });
            
            const data = await res.json();
            if (data.whatsappUrl) {
                window.open(data.whatsappUrl, '_blank');
                setTimeout(() => {
                    document.getElementById('share-modal')?.classList.remove('modal-hidden');
                    document.getElementById('cart-summary')?.classList.add('cart-hidden');
                }, 1000);
            }
        } catch (e) {
            UI.showToast("Erreur lors de l'envoi");
        }
    },

    bindEvents() {
        // Navigation mobile
        document.getElementById('open-cart-mobile')?.addEventListener('click', () => {
            document.getElementById('cart-summary')?.classList.remove('cart-hidden');
        });

        document.getElementById('close-cart')?.addEventListener('click', () => {
            document.getElementById('cart-summary')?.classList.add('cart-hidden');
        });

        // Toggle Adresse
        document.querySelectorAll('input[name="order-type"]').forEach(r => {
            r.addEventListener('change', (e) => {
                document.getElementById('address-section')?.classList.toggle('hidden', e.target.value === 'pickup');
            });
        });

        // Checkout
        document.getElementById('checkout-whatsapp')?.addEventListener('click', () => this.sendOrder());

        // Partage
        document.getElementById('share-on-whatsapp')?.addEventListener('click', () => {
            const msg = encodeURIComponent(`🤩 Je viens de commander chez A 'LIM G Aubagne ! 🍺 ${window.location.origin}`);
            window.open(`https://wa.me/?text=${msg}`, '_blank');
        });

        document.getElementById('close-share')?.addEventListener('click', () => {
            document.getElementById('share-modal')?.classList.add('modal-hidden');
        });

        // Sticky Filter Bar
        window.addEventListener('scroll', () => {
            const bar = document.getElementById('filter-bar');
            const hub = document.querySelector('.category-hub');
            if (hub && bar) {
                bar.classList.toggle('scrolled', window.scrollY > (hub.offsetTop + hub.offsetHeight - 50));
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
