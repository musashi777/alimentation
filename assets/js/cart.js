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

    add(id, name, price, image) {
        if (this.items.has(id)) {
            this.items.get(id).quantity += 1;
        } else {
            this.items.set(id, { name, price, image, quantity: 1 });
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
        let hasAlcohol = false;
        let hasSnack = false;

        this.items.forEach((item, id) => {
            total += item.price * item.quantity;
            cartArray.push({ id, ...item });

            // Détection du contenu pour Smart Bundling
            const name = item.name.toLowerCase();
            if (name.includes('vodka') || name.includes('whisky') || name.includes('rhum') || name.includes('gin')) hasAlcohol = true;
            if (name.includes('chips') || name.includes('cacahuète') || name.includes('doritos')) hasSnack = true;
        });

        // Génération de suggestions intelligentes
        let suggestions = [];
        if (hasAlcohol && !this.items.has('soda_1')) {
            suggestions.push({ id: 'soda_1', name: 'Coca-Cola 1.5L', price: 4.50, icon: '🥤', image: '/images/facade.jpg' });
        }
        if (hasSnack && !this.items.has('beer_1')) {
            suggestions.push({ id: 'beer_1', name: 'Heineken x6', price: 11.50, icon: '🍺', image: '/images/facade.jpg' });
        }
        if (total > 0 && !this.items.has('home_1')) {
            suggestions.push({ id: 'home_1', name: 'Briquet BIC', price: 2.50, icon: '🔥', image: '/images/facade.jpg' });
        }

        return { cartArray, total, suggestions };
    },
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
            let section = document.getElementById(sectionId);
            
            // Si la catégorie n'existe pas dans le HTML statique (nouveauté Airtable)
            if (!section) {
                const layout = document.querySelector('.store-layout');
                if (layout) {
                    const newSection = document.createElement('section');
                    newSection.id = sectionId;
                    newSection.className = 'category-section';
                    newSection.innerHTML = `
                        <h2 class="category-title">🆕 ${cat}</h2>
                        <div class="product-grid"></div>
                    `;
                    layout.appendChild(newSection);
                    section = newSection;
                }
            }

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
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
        .replace(/[^\w\s-]/g, '') // Supprime emojis et caractères spéciaux
        .replace(/[\s_]+/g, '-') // Remplace espaces par tirets
        .replace(/^-+|-+$/g, ''), // Nettoyage O(1)

    productTemplate: (p) => {
        // Fallback pour les images manquantes ou brisées
        const imgSrc = p.image || '/images/facade.jpg';
        
        return `
        <div class="product-card" data-id="${p.id}">
            ${p.tag ? `<span class="badge">${p.tag}</span>` : ''}
            <div class="product-image-container">
                <img src="${imgSrc}" alt="${p.name}" class="product-img" loading="lazy">
            </div>
            <div class="product-info">
                <h3>${p.name}</h3>
                ${p.description ? `<p class="description">${p.description}</p>` : ''}
                <p class="price">${p.price.toFixed(2)}€ / ${p.unite}</p>
                <div class="card-action-box" id="action-${p.id}" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}" data-img="${imgSrc}">
                    <button class="add-to-cart" onclick="App.addToCart('${p.id}', '${p.name}', ${p.price}, '${imgSrc}')">
                        Ajouter
                    </button>
                </div>
            </div>
        </div>
    `;
    },

    updateCartUI() {
        const { cartArray, total, suggestions } = Store.getSummary();
        const list = document.getElementById('cart-items');
        const totalEl = document.getElementById('total-price');
        const badge = document.getElementById('cart-count');
        const emptyState = document.getElementById('empty-cart');
        const suggestionBox = document.querySelector('.suggestion-chips');

        // Gestion de l'état vide
        if (emptyState) emptyState.classList.toggle('hidden', cartArray.length > 0);

        if (list) {
            list.innerHTML = cartArray.map(i => `
                <li class="cart-item">
                    <img src="${i.image || '/images/facade.jpg'}" class="cart-item-img" alt="${i.name}">
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

        // Rendu des suggestions dynamiques
        if (suggestionBox) {
            if (suggestions.length > 0) {
                suggestionBox.innerHTML = suggestions.map(s => `
                    <button class="add-to-cart chip" 
                            onclick="App.addToCart('${s.id}', '${s.name}', ${s.price}, '${s.image}')">
                        ${s.icon} +${s.price.toFixed(2)}€ ${s.name}
                    </button>
                `).join('');
            } else {
                suggestionBox.innerHTML = '<p class="small">Aucune suggestion pour le moment.</p>';
            }
        }

        if (totalEl) totalEl.textContent = total.toFixed(2);
        if (badge) badge.textContent = cartArray.reduce((acc, i) => acc + i.quantity, 0);

        // NOUVEAU : Mise à jour du Mini-Carousel Flottant
        const floatingBar = document.getElementById('floating-cart-bar');
        const carouselItems = document.getElementById('mini-carousel-items');
        const floatingBtn = document.getElementById('open-cart-floating');
        
        if (floatingBar && carouselItems && floatingBtn) {
            if (cartArray.length > 0) {
                floatingBar.classList.add('visible');
                carouselItems.innerHTML = cartArray.map(i => `<img src="${i.image || '/images/facade.jpg'}" class="mini-cart-img">`).join('');
                floatingBtn.textContent = `Valider ${total.toFixed(2)}€`;
            } else {
                floatingBar.classList.remove('visible');
            }
        }

        // NOUVEAU : Synchronisation DOM des boutons Ajouter -> Sélecteur Rapide Quantité O(n) visuel
        document.querySelectorAll('.card-action-box').forEach(box => {
            const id = box.dataset.id;
            if (Store.items.has(id)) {
                const qty = Store.items.get(id).quantity;
                box.innerHTML = `
                    <div class="fast-qty-controls">
                        <button class="fast-qty-btn" onclick="App.updateQty('${id}', -1)">−</button>
                        <span class="fast-qty-count">${qty}</span>
                        <button class="fast-qty-btn" onclick="App.updateQty('${id}', 1)">+</button>
                    </div>
                `;
            } else {
                const name = box.dataset.name.replace(/'/g, "\\'");
                const img = box.dataset.img;
                const price = box.dataset.price;
                box.innerHTML = `
                    <button class="add-to-cart" onclick="App.addToCart('${id}', '${name}', ${price}, '${img}')">
                        Ajouter
                    </button>
                `;
            }
        });
    },

    updateStatus() {
        const now = new Date();
        const hour = now.getHours();
        const day = now.getDay(); 
        
        const statusEl = document.getElementById('status-indicator');
        const statusText = document.getElementById('status-text');
        const topBanner = document.querySelector('.top-banner');
        if (!statusEl || !statusText) return;

        let isOpen = false;
        let closingTime = (day === 5 || day === 6) ? "02:00" : "22:00";

        if (day === 5 || day === 6) {
            if (hour >= 10 || hour < 2) isOpen = true;
        } else {
            if (hour >= 10 && hour < 22) isOpen = true;
        }

        // Mode Nuit Dynamique (Après 20h)
        if (hour >= 20 || hour < 5) {
            document.body.classList.add('night-mode');
            if (topBanner) topBanner.innerHTML = '<span>🚀 MODE NUIT ACTIF : Livraison Prioritaire Aubagne Avenue des Goums ⚡</span>';
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
        if (!Store.items.has(id)) return;
        
        if (delta > 0) {
            const item = Store.items.get(id);
            Store.add(id, item.name, item.price, item.image);
        } else {
            Store.decrease(id);
        }
        UI.updateCartUI();
    },

    async loadProducts() {
        // Tentative de chargement via API (Airtable) avec anti-cache
        try {
            const res = await fetch(`/api/products?t=${Date.now()}`);
            const contentType = res.headers.get("content-type");
            
            // Si Vercel renvoie du HTML, c'est que l'accès est bloqué par une page de login
            if (contentType && contentType.indexOf("text/html") !== -1) {
                throw new Error("ACCÈS BLOQUÉ PAR VERCEL (Vérifiez Deployment Protection)");
            }

            if (res.ok) {
                const products = await res.json();
                UI.renderProducts(products);
                return; // Succès API
            }
            throw new Error("API Indisponible");
        } catch (e) {
            console.warn("Erreur API :", e.message);
            UI.showToast("Mode hors-ligne : Données statiques activées");
            // Si l'API échoue, on utilise les données injectées par Hugo
            if (window.HUGO_PRODUCTS && window.HUGO_PRODUCTS.length > 0) {
                UI.renderProducts(window.HUGO_PRODUCTS);
            }
        }
    },

    addToCart(id, name, price, image) {
        Store.add(id, name, price, image);
        UI.updateCartUI();
        UI.showToast(`${name} ajouté !`);
        
        // Ouverture animée du panier
        document.getElementById('cart-summary')?.classList.remove('cart-hidden');
        document.getElementById('cart-overlay')?.classList.remove('cart-overlay-hidden');
        
        // Micro-interaction sur le bouton
        const btn = document.querySelector(`.product-card[data-id="${id}"] .add-to-cart`);
        if (btn) {
            const originalText = btn.textContent;
            btn.textContent = "C'est dans le panier ! ✅";
            btn.classList.add('success');
            setTimeout(() => {
                btn.textContent = originalText;
                btn.classList.remove('success');
            }, 1500);
        }
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
        const isDrive = document.getElementById('is-drive')?.checked || false;
        const { cartArray, total } = Store.getSummary();

        if (orderType === 'delivery' && !address) {
            UI.showToast("Merci d'indiquer votre adresse !");
            return;
        }

        try {
            const res = await fetch('/api/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cart: cartArray, total, orderType, address, isDrive })
            });
            
            const data = await res.json();
            if (data.whatsappUrl) {
                window.open(data.whatsappUrl, '_blank');
                setTimeout(() => {
                    document.getElementById('share-modal')?.classList.remove('modal-hidden');
                    document.getElementById('cart-summary')?.classList.add('cart-hidden');
                    document.getElementById('cart-overlay')?.classList.add('cart-overlay-hidden');
                }, 1000);
            }
        } catch (e) {
            UI.showToast("Erreur lors de l'envoi");
        }
    },

    bindEvents() {
        const closeCart = () => {
            document.getElementById('cart-summary')?.classList.add('cart-hidden');
            document.getElementById('cart-overlay')?.classList.add('cart-overlay-hidden');
        };

        const openCart = () => {
            document.getElementById('cart-summary')?.classList.remove('cart-hidden');
            document.getElementById('cart-overlay')?.classList.remove('cart-overlay-hidden');
        };

        // Navigation mobile & carrousel
        document.getElementById('open-cart-mobile')?.addEventListener('click', openCart);
        document.getElementById('open-cart-floating')?.addEventListener('click', openCart);
        document.getElementById('close-cart')?.addEventListener('click', closeCart);
        document.getElementById('cart-overlay')?.addEventListener('click', closeCart);

        // Recherche DOM O(n) instantanée
        const searchInput = document.getElementById('product-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                document.querySelectorAll('.product-card').forEach(card => {
                    const text = card.textContent.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    card.style.display = text.includes(term) ? 'block' : 'none';
                });
                
                // Masquage automatique des catégories vides
                document.querySelectorAll('.category-section').forEach(section => {
                    const hasVisible = Array.from(section.querySelectorAll('.product-card')).some(c => c.style.display !== 'none');
                    section.style.display = hasVisible ? 'block' : 'none';
                });
            });
        }

        // Toggle Adresse et Option Drive
        document.querySelectorAll('input[name="order-type"]').forEach(r => {
            r.addEventListener('change', (e) => {
                const isDelivery = e.target.value === 'delivery';
                document.getElementById('address-section')?.classList.toggle('hidden', !isDelivery);
                document.getElementById('drive-option')?.classList.toggle('hidden', isDelivery);
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
