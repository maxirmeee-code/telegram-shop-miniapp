// web/script.js – VERSION 100% FINALE : numéro de commande + redirection correcte
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('products');
  let cart = [];
  let products = [];

  // Chargement produits depuis JSON
  fetch('/products.json')
    .then(r => r.json())
    .then(data => {
      products = data;
      document.querySelector('.cat-btn[data-cat="all"]')?.click();
    })
    .catch(() => alert("Erreur chargement produits"));

  // === AJOUT / SUPPRESSION PANIER ===
  window.addToCart = (name, weight, price) => {
    cart.push({ name, weight, price });
    updateCartIcon();
    Telegram.WebApp.HapticFeedback?.impactOccurred('light');
  };

  window.removeFromCart = (index) => {
    cart.splice(index, 1);
    updateCartIcon();
    renderCartPopup();
  };

  // === ICÔNE CADDIE ===
  const createCartIcon = () => {
    const icon = document.createElement('div');
    icon.id = 'cart-icon';
    icon.innerHTML = `<span id="cart-count">0</span>`;
    icon.style = 'position:fixed;top:20px;right:20px;background:#25D366;color:white;padding:10px 15px;border-radius:50px;cursor:pointer;z-index:1000;font-weight:bold;';
    icon.onclick = toggleCartPopup;
    document.body.appendChild(icon);
  };

  const updateCartIcon = () => {
    const count = document.getElementById('cart-count');
    if (count) count.textContent = cart.length;
  };

  // === POPUP PANIER ===
  const toggleCartPopup = () => {
    const existing = document.getElementById('cart-popup');
    if (existing) {
      existing.remove();
      return;
    }
    renderCartPopup();
  };

  const renderCartPopup = () => {
    document.getElementById('cart-popup')?.remove();
    if (cart.length === 0) return;

    const total = cart.reduce((sum, item) => sum + item.price, 0).toFixed(2);

    const popup = document.createElement('div');
    popup.id = 'cart-popup';
    popup.style = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;`;

    popup.innerHTML = `
      <div style="background:white;width:90%;max-width:400px;border-radius:15px;overflow:hidden;">
        <div style="background:#25D366;color:white;padding:15px;display:flex;justify-content:space-between;align-items:center;">
          <strong>Panier (${cart.length} article${cart.length > 1 ? 's' : ''})</strong>
          <button onclick="toggleCartPopup()" style="background:none;border:none;color:white;font-size:24px;cursor:pointer;">×</button>
        </div>
        <div style="max-height:50vh;overflow-y:auto;padding:15px;">
          ${cart.map((item, i) => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #eee;">
              <div><strong>${item.name}</strong><br><small style="color:#666;">${item.weight} → ${item.price}€</small></div>
              <button onclick="removeFromCart(${i})" style="background:#e74c3c;color:white;border:none;width:30px;height:30px;border-radius:50%;font-weight:bold;cursor:pointer;">×</button>
            </div>
          `).join('')}
        </div>
        <div style="padding:15px;background:#f8f9fa;">
          <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:bold;margin-bottom:15px;">
            <span>Total</span><span>${total}€</span>
          </div>
          <button id="checkout-btn" style="width:100%;padding:14px;background:#25D366;color:white;border:none;border-radius:12px;font-size:16px;font-weight:bold;cursor:pointer;">
            Valider la commande
          </button>
        </div>
      </div>
    `;

    popup.addEventListener('click', e => e.target === popup && toggleCartPopup());
    document.body.appendChild(popup);

    // === BOUTON VALIDER – VERSION FINALE (numéro + redirection correcte) ===
    document.getElementById('checkout-btn').addEventListener('click', async () => {
      if (cart.length === 0) return;

      const user = Telegram.WebApp.initDataUnsafe.user || {};
      const username = user.username || user.first_name || "Anonyme";
      const total = cart.reduce((s, i) => s + i.price, 0);

      const order = {
        username,
        userId: user.id || "inconnu",
        items: cart.map(i => ({ name: i.name, weight: i.weight, price: i.price })),
        total
      };

      try {
        const res = await fetch('/api/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order })
        });

        const data = await res.json();

	if (data.success) {
  	
	const order = {
  	username,
  	userId,
  	initData: Telegram.WebApp.initData, // ← AJOUTÉ POUR VALIDATION
  	items: cart.map(i => ({ name: i.name, weight: i.weight, price: i.price })),
  	total
	};
  	alert(`Commande validée !\n\nTon numéro de panier :\n${orderNum}\n\nEnvoie-le avec ton panier !`);
  
  	// REDIRECTION FORCÉE (avant de fermer le popup → marche à 100% sur Telegram)
  	window.location.href = `https://telegram-shop-miniapp.vercel.app/networks/?order=${orderNum}`;
  	
  	// On vide le panier et ferme après (mais la redirection est déjà lancée)
  	cart = [];
  	updateCartIcon();
  	setTimeout(toggleCartPopup, 500); // petite sécurité
	}



 else {
          alert("Erreur envoi. Réessaie.");
        }
      } catch (err) {
        alert("Erreur réseau.");
      }
    });
  };

  // === AFFICHAGE PRODUIT ===
  const showProduct = (p) => {
    const div = document.createElement('div');
    div.className = 'product-card';
    div.dataset.cat = p.category;
    div.innerHTML = `
      <img src="${p.image}" alt="${p.name}" style="width:100%;height:180px;object-fit:cover;border-radius:12px;">
      <h3 style="margin:10px 0 5px;font-size:18px;">${p.name}</h3>
      <p style="color:#555;font-size:14px;margin-bottom:10px;">${p.description}</p>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${p.options.map(o => `
          <button class="add-btn" onclick="addToCart('${p.name.replace(/'/g, "\\'")}', '${o.weight}', ${o.price})"
                  style="background:#25D366;color:white;border:none;padding:8px 12px;border-radius:8px;font-size:14px;cursor:pointer;">
            ${o.weight} → ${o.price}€
          </button>
        `).join('')}
      </div>
    `;
    container.appendChild(div);
  };

  // === FILTRE CATÉGORIES ===
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      container.innerHTML = '<h2 style="text-align:center;margin:20px 0;color:#25D366;">NOS PRODUITS</h2>';
      const filtered = btn.dataset.cat === 'all' ? products : products.filter(p => p.category === btn.dataset.cat);
      filtered.forEach(showProduct);
    };
  });

  // === LANCEMENT ===
  createCartIcon();
  updateCartIcon();

  if (window.Telegram?.WebApp?.initData) {
    fetch('/api/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ initData: Telegram.WebApp.initData }) })
      .then(r => r.json())
      .then(data => { if (data.valid) { document.querySelector('.cat-btn[data-cat="all"]')?.click(); Telegram.WebApp.ready(); } })
      .catch(() => document.querySelector('.cat-btn[data-cat="all"]')?.click());
  } else {
    document.querySelector('.cat-btn[data-cat="all"]')?.click();
  }
});