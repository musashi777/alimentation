/**
 * Logique du panier optimisée avec une Map (Table de hachage)
 * Complexité :
 * - Insertion/Mise à jour : O(1)
 * - Suppression : O(1)
 * - Recherche d'un article : O(1)
 */

class Cart {
    constructor() {
        this.checkAgeGate(); // Vérification de l'âge d'abord
        this.registerServiceWorker(); // PWA
        this.items = this.loadCartFromStorage();
        this.total = 0;
        this.whatsappNumber = "33600000000";
        this.init();
        this.updateStatus();
        this.loadProductsFromAPI();
        this.updateUI();
    }

    checkAgeGate() {
        const hasConsented = localStorage.getItem('age_consented');
        const ageGate = document.getElementById('age-gate');
        
        if (!hasConsented) {
            ageGate.classList.remove('modal-hidden');
        }

        document.getElementById('age-confirm').addEventListener('click', () => {
            localStorage.setItem('age_consented', 'true');
            ageGate.classList.add('modal-hidden');
        });

        document.getElementById('age-deny').addEventListener('click', () => {
            window.location.href = 'https://www.google.com';
        });
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then(() => {
                console.log('PWA Service Worker Registered');
            }).catch(err => console.log('SW failed', err));
        }
    }

    loadCartFromStorage() {
        const savedCart = localStorage.getItem('alimentation_cart');
        if (savedCart) {
            try {
                const obj = JSON.parse(savedCart);
                // On s'assure que c'est bien une Map d'objets valides
                return new Map(Object.entries(obj));
            } catch (e) {
                console.error("Erreur de chargement du panier:", e);
                return new Map();
            }
        }
        return new Map();
    }

    saveCartToStorage() {
        // On transforme la Map en objet JSON pour le stockage
        const obj = Object.fromEntries(this.items);
        localStorage.setItem('alimentation_cart', JSON.stringify(obj));
    }

    updateStatus() {
        const now = new Date();
        const hour = now.getHours();
        const day = now.getDay(); // 0 = Dimanche, 5 = Vendredi, 6 = Samedi
        
        const statusEl = document.getElementById('status-indicator');
        const statusText = document.getElementById('status-text');
        
        let isOpen = false;
        let closingTime = "";

        // Logique basée sur l'arrêté préfectoral :
        // Semaine : 10h - 22h
        // Weekend (Ven/Sam) : 10h - 02h (nuit)
        if (day === 5 || day === 6) { // Vendredi ou Samedi
            if (hour >= 10 || hour < 2) {
                isOpen = true;
                closingTime = "02:00";
            }
        } else { // Reste de la semaine
            if (hour >= 10 && hour < 22) {
                isOpen = true;
                closingTime = "22:00";
            }
        }

        if (isOpen) {
            statusEl.className = "status-online";
            statusText.textContent = `Ouvert • Ferme à ${closingTime}`;
        } else {
            statusEl.className = "status-offline";
            statusText.textContent = "Fermé • Ouvre à 10:00";
        }
    }

    async loadProductsFromAPI() {
        try {
            const response = await fetch('/api/products');
            if (response.ok) {
                const products = await response.json();
                if (products && products.length > 0) {
                    this.renderDynamicGrid(products);
                }
            }
        } catch (error) {
            console.log("Mode statique activé (API hors ligne)");
        }
    }

    renderDynamicGrid(products) {
        // On regroupe les produits par catégorie dynamiquement (O(n))
        const categories = [...new Set(products.map(p => p.category))];
        
        categories.forEach(cat => {
            const sectionId = `rayon-${this.urlize(cat)}`;
            const section = document.getElementById(sectionId);
            if (!section) return;

            const grid = section.querySelector('.product-grid');
            grid.innerHTML = ''; // On vide pour mettre les vraies données Airtable

            products.filter(p => p.category === cat).forEach(p => {
                const card = document.createElement('div');
                card.className = 'product-card';
                card.dataset.id = p.id;
                card.innerHTML = `
                    ${p.tag ? `<span class="badge">${p.tag}</span>` : ''}
                    <div class="product-image" style="background-image: url('${p.image}')"></div>
                    <div class="product-info">
                        <h3>${p.name}</h3>
                        ${p.description ? `<p class="description">${p.description}</p>` : ''}
                        <p class="price">${p.price.toFixed(2)}€ / ${p.unite}</p>
                        <button class="add-to-cart" 
                                data-id="${p.id}" 
                                data-name="${p.name}" 
                                data-price="${p.price}">
                            Ajouter
                        </button>
                    </div>
                `;
                grid.appendChild(card);
            });
        });
    }

    urlize(str) {
        return str.toLowerCase()
            .replace(/[🍹🍺🍟🍦🔥\s]/g, '-')
            .replace(/-+/g, '-')
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    init() {
        // Navigation fluide (Hub + Filter Bar) simplifiée par scroll-padding CSS
        const allNavLinks = document.querySelectorAll('.filter-btn, .hub-card');
        allNavLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('href').substring(1);
                
                if (targetId === 'rayon-all') {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
                // Pour les autres, on laisse le navigateur gérer l'ancre nativement
                // car scroll-padding-top dans le CSS gère désormais l'offset idéal.
            });
        });

        // Gestion de la visibilité de la barre sticky
        window.addEventListener('scroll', () => {
            const filterBar = document.getElementById('filter-bar');
            const hub = document.querySelector('.category-hub');
            if (!hub) return;
            
            const triggerPoint = hub.offsetTop + hub.offsetHeight - 50;
            
            if (window.scrollY > triggerPoint) {
                filterBar.classList.add('scrolled');
            } else {
                filterBar.classList.remove('scrolled');
            }
        });

        // Intersection Observer précis pour allumer le bouton du rayon actuel
        const filterBtns = document.querySelectorAll('.filter-btn');
        const observerOptions = {
            root: null,
            rootMargin: '-120px 0px -80% 0px', // Zone de détection précise en haut de l'écran
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    filterBtns.forEach(btn => {
                        btn.classList.toggle('active', btn.getAttribute('href') === `#${id}`);
                    });
                }
            });
        }, observerOptions);

        document.querySelectorAll('.category-section').forEach(section => {
            observer.observe(section);
        });

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart')) {
                const { id, name, price } = e.target.dataset;
                this.addItem(id, name, parseFloat(price));
            }
        });

        const checkoutBtn = document.getElementById('checkout-whatsapp');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.sendToWhatsApp());
        }

        const closeBtn = document.getElementById('close-cart');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                document.getElementById('cart-summary').classList.add('cart-hidden');
            });
        }

        // Écouteurs pour le modal de partage
        const shareBtn = document.getElementById('share-on-whatsapp');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareOnStatus());
        }

        const closeShareBtn = document.getElementById('close-share');
        if (closeShareBtn) {
            closeShareBtn.addEventListener('click', () => {
                document.getElementById('share-modal').classList.add('modal-hidden');
            });
        }

        // Ouvrir le panier depuis la nav mobile
        const openCartMobile = document.getElementById('open-cart-mobile');
        if (openCartMobile) {
            openCartMobile.addEventListener('click', () => this.showCart());
        }

        // Toggle adresse livraison / retrait
        const orderTypeRadios = document.querySelectorAll('input[name="order-type"]');
        const addressSection = document.getElementById('address-section');
        
        orderTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.value === 'pickup') {
                    addressSection.classList.add('hidden');
                } else {
                    addressSection.classList.remove('hidden');
                }
            });
        });
    }

    addItem(id, name, price) {
        if (this.items.has(id)) {
            const item = this.items.get(id);
            item.quantity += 1;
        } else {
            this.items.set(id, { name, price, quantity: 1 });
        }
        
        this.showToast(`${name} ajouté !`);
        this.saveCartToStorage(); // Sauvegarde locale
        this.updateUI();
        this.showCart();
    }

    showToast(msg) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
    }

    updateUI() {
        const cartItemsList = document.getElementById('cart-items');
        const totalPriceEl = document.getElementById('total-price');
        
        if (!cartItemsList) return;

        cartItemsList.innerHTML = '';
        let currentTotal = 0;

        // Itération efficace sur les entrées de la Map
        this.items.forEach((item, id) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${item.name} x${item.quantity}</span>
                <span>${(item.price * item.quantity).toFixed(2)}€</span>
            `;
            cartItemsList.appendChild(li);
            currentTotal += item.price * item.quantity;
        });

        this.total = currentTotal;
        totalPriceEl.textContent = this.total.toFixed(2);

        // Mettre à jour le badge de la nav mobile
        const cartCountEl = document.getElementById('cart-count');
        if (cartCountEl) {
            let count = 0;
            this.items.forEach(item => count += item.quantity);
            cartCountEl.textContent = count;
        }

        // Masquer les suggestions si déjà dans le panier
        document.querySelectorAll('.suggestion-chips .add-to-cart').forEach(chip => {
            if (this.items.has(chip.dataset.id)) {
                chip.style.display = 'none';
            } else {
                chip.style.display = 'inline-block';
            }
        });
    }

    showCart() {
        const cartSummary = document.getElementById('cart-summary');
        if (cartSummary) cartSummary.classList.remove('cart-hidden');
    }

    sendToWhatsApp() {
        const orderType = document.querySelector('input[name="order-type"]:checked').value;
        const address = document.getElementById('delivery-address').value;
        
        if (orderType === 'delivery' && !address) {
            this.showToast("Merci d'indiquer votre adresse !");
            document.getElementById('delivery-address').focus();
            return;
        }

        let message = "";
        if (orderType === 'delivery') {
            message += "🚚 NOUVELLE COMMANDE LIVRAISON (A 'LIM G)\n";
            message += "---------------------------\n";
            message += `📍 Adresse : ${address}\n\n`;
        } else {
            message += "🏃 NOUVELLE COMMANDE À RÉCUPÉRER (A 'LIM G)\n";
            message += "---------------------------\n";
            message += "🏪 Mode : Click & Collect (Aubagne)\n\n";
        }
        
        message += "🛒 Produits :\n";
        
        this.items.forEach((item) => {
            message += `• ${item.name} (x${item.quantity})\n`;
        });

        message += `\n💰 Total : ${this.total.toFixed(2)}€\n`;
        message += "---------------------------\n";
        
        if (orderType === 'delivery') {
            message += "⏰ Merci de me confirmer le délai de livraison !";
        } else {
            message += "🕒 Je passerai récupérer ma commande dans 15 min !";
        }
        
        const encodedMessage = encodeURIComponent(message);
        const url = `https://wa.me/${this.whatsappNumber}?text=${encodedMessage}`;
        window.open(url, '_blank');

        // Afficher le modal de partage après un court délai
        setTimeout(() => {
            document.getElementById('share-modal').classList.remove('modal-hidden');
            document.getElementById('cart-summary').classList.add('cart-hidden');
        }, 1000);
    }

    shareOnStatus() {
        const shareMessage = `🤩 Je viens de commander chez A 'LIM G Aubagne ! 🍺 Leurs packs soirée sont tops et la livraison est super rapide. Jetez un œil ici : ${window.location.origin}`;
        const encodedShare = encodeURIComponent(shareMessage);
        window.open(`https://wa.me/?text=${encodedShare}`, '_blank');
        document.getElementById('share-modal').classList.add('modal-hidden');
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    window.cart = new Cart();
});
