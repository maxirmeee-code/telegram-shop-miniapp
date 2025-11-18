// web/script.js – VERSION FINALE 100% FONCTIONNELLE (PC + Mini App Telegram)
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('products');
  let cart = [];
  let products = [];

  // Chargement produits
  fetch('/products.json')
    .then(r => r.json())
    .then(data => {
      products = data;
      document.querySelector('.cat-btn[data-cat="all"]')?.click();
    })
    .catch(err => {
      container.innerHTML = "<p style='color:red;text-align:center;'>Erreur chargement produits</p>";
      console.error(err);
    });

  // Ajout au panier
  window.addToCart = (name, weight, price) => {
    cart.push({ name, weight, price });
    updateCartIcon();
    Telegram.WebApp?.HapticFeedback?.impactOccurred('light');
  };

  window.removeFromCart = i => {
    cart.splice(i, 1);
    updateCartIcon();
    renderCartPopup();
  };

  // Icône panier
  const createCartIcon = () => {
    if (document.getElementById('cart-icon')) return;
    const icon = document.createElement('div');
    icon.id = 'cart-icon';
    icon.innerHTML = `Panier<span id="cart-count">0</span>`;
    icon.style.cssText = 'position:fixed;top:15px;right:15px;background:#25D366;color:white;padding:10px 16px;border-radius:50px;cursor:pointer;z-index:1000;font-weight:bold;box-shadow:0 4px 10px rgba(0,0,0,0.3);';
    icon.onclick = toggleCartPopup;
    document.body.appendChild(icon);
  };

  const updateCartIcon = () => document.getElementById('cart-count')?.then(c => c.textContent = cart.length);

  // Popup panier
  const toggleCartPopup = () => document.getElementById('cart-popup') ? document.getElementById('cart-popup').remove() : renderCartPopup();

  const renderCartPopup = () => {
    document.getElementById('cart-popup')?.remove();
    if (cart.length === 0) return;

    const total = cart.reduce((s, i) => s + i.price, 0).toFixed(2);

    const popup = document.createElement('div');
    popup.id = 'cart-popup';
    popup.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:flex-end;z-index:9999;';
    popup.innerHTML = `
      <div style="background:white;width:100%;border-radius:20px 20px 0 0;padding:20px;max-height:80vh;overflow-y:auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
          <h3 style="margin:0;">Panier (${cart.length})</h3>
          <button onclick="toggleCartPopup()" style="background:none;border:none;font-size:28px;">×</button>
        </div>
        ${cart.map((item, i) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #eee;">
            <div><strong>${item.name}</strong><br><small>${item.weight} → ${item.price}€</small></div>
            <button onclick="removeFromCart(${i})" style="background:#e74c3c;color:white;border:none;width:30px;height:30px;border-radius:50%;font-weight:bold;">×</button>
          </div>
        `).join('')}
        <div style="margin:20px 0;font-size:20px;font-weight:bold;text-align:center;">
          Total : ${total} €
        </div>
        <button id="checkout-btn" style="width:100%;padding:15px;background:#25D366;color:white;border:none;border-radius:12px;font-size:18px;font-weight:bold;">
          Valider la commande
        </button>
      </div>
    `;
    popup.onclick = e => e.target === popup && toggleCartPopup();
    document.body.appendChild(popup);

    // === VALIDATION COMMANDE – FIX DÉFINITIF MINI APP ===
    document.getElementById('checkout-btn').onclick = async () => {
      const currentCart = [...cart];  // copie pour éviter le vidage prématuré
      if (currentCart.length === 0) return alert("Panier vide !");

      const user = Telegram.WebApp.initDataUnsafe?.user || {};
      const totalAmount = currentCart.reduce((s, i) => s + i.price, 0);

      const payload = {
        username: user.username || user.first_name || "Anonyme",
        userId: user.id?.toString() || "inconnu",
        items: currentCart.map(i => ({ name: i.name, weight: i.weight, price: i.price })),
        total: totalAmount
      };

      try {
        const res = await fetch('/api/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.success && data.orderNumber) {
          alert(`Commande validée !\n\nNuméro : ${data.orderNumber}\n\nEnvoie-le avec ton panier !`);
          window.location.href = `https://telegram-shop-miniapp.vercel.app/networks/?order=${data.orderNumber}`;
          cart = [];
          updateCartIcon();
          toggleCartPopup();
        } else {
          alert("Erreur : " + (data.error || "serveur"));
        }
      } catch (err) {
        alert("Erreur réseau – réessaie dans 5s");
      }
    };
  };

  // Affichage produits
  const showProduct = p => {
    const div = document.createElement('div');
    div.className = 'product-card';
    div.dataset.cat = p.category;
    div.innerHTML = `
      <img src="${p.image}" style="width:100%;height:180px;object-fit:cover;border-radius:12px;">
      <h3 style="margin:10px 0 5px;">${p.name}</h3>
      <p style="color:#666;font-size:14px;">${p.description}</p>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;">
        ${p.options.map(o => `
          <button onclick="addToCart('${p.name.replace(/'/g, "\\'")}', '${o.weight}', ${o.price})"
                  style="background:#25D366;color:white;border:none;padding:8px 12px;border-radius:8px;font-size:14px;">
            ${o.weight} → ${o.price}€
          </button>
        `).join('')}
      </div>
    `;
    container.appendChild(div);
  };

  // Filtres catégories
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      container.innerHTML = '<h2 style="text-align:center;color:#25D366;margin:30px 0;">NOS PRODUITS</h2>';
      const filtered = btn.dataset.cat === 'all' ? products : products.filter(p => p.category === btn.dataset.cat);
      filtered.forEach(showProduct);
    };
  });

  // Démarrage
  createCartIcon();
  updateCartIcon();
  Telegram.WebApp?.ready();
  setTimeout(() => document.querySelector('.cat-btn[data-cat="all"]')?.click(), 500);
});