// web/script.js – PANIER FIXÉ + COMMANDES ENVOYÉES DANS ADMIN
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('products');
  let cart = [];
  let products = [];

  // === CHARGEMENT PRODUITS DEPUIS products.json ===
  fetch('/products.json')
    .then(r => r.json())
    .then(data => {
      products = data;
      document.querySelector('.cat-btn[data-cat="all"]')?.click();
    })
    .catch(() => {
      alert("Erreur chargement produits");
    });

  // === AJOUT AU PANIER ===
  window.addToCart = (name, weight, price) => {
    cart.push({ name, weight, price });
    updateCartIcon();
    Telegram.WebApp.HapticFeedback?.impactOccurred('light');
  };

  // === SUPPRESSION DU PANIER ===
  window.removeFromCart = (index) => {
    cart.splice(index, 1);
    updateCartIcon();
    renderCartPopup();
  };

  // === ICÔNE CADDIE ===
  const createCartIcon = () => {
    const icon = document.createElement('div');
    icon.id = 'cart-icon';
    icon.innerHTML = `Panier<span id="cart-count">0</span>`;
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
    popup.style = `
      position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);
      display:flex;align-items:center;justify-content:center;z-index:9999;
    `;

    popup.innerHTML = `
      <div style="background:white;width:90%;max-width:400px;border-radius:15px;overflow:hidden;">
        <div style="background:#25D366;color:white;padding:15px;display:flex;justify-content:space-between;align-items:center;">
          <strong>Panier (${cart.length} article${cart.length > 1 ? 's' : ''})</strong>
          <button onclick="toggleCartPopup()" style="background:none;border:none;color:white;font-size:24px;cursor:pointer;">×</button>
        </div>
        <div style="max-height:50vh;overflow-y:auto;padding:15px;">
          ${cart.map((item, i) => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #eee;">
              <div>
                <div><strong>${item.name}</strong></div>
                <small style="color:#666;">${item.weight} → ${item.price}€</small>
              </div>
              <button onclick="removeFromCart(${i})" style="background:#e74c3c;color:white;border:none;width:30px;height:30px;border-radius:50%;font-weight:bold;cursor:pointer;">×</button>
            </div>
          `).join('')}
        </div>
        <div style="padding:15px;background:#f8f9fa;">
          <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:bold;margin-bottom:15px;">
            <span>Total</span>
            <span>${total}€</span>
          </div>
          <button id="checkout-btn" style="width:100%;padding:14px;background:#25D366;color:white;border:none;border-radius:12px;font-size:16px;font-weight:bold;cursor:pointer;">
            Valider la commande
          </button>
        </div>
      </div>
    `;

    popup.addEventListener('click', (e) => {
      if (e.target === popup) toggleCartPopup();
    });

    document.body.appendChild(popup);

    // === ENVOI COMMANDE À GITHUB (orders.json) ===
    document.getElementById('checkout-btn').addEventListener('click', async () => {
      if (cart.length === 0) return;

      const user = Telegram.WebApp.initDataUnsafe.user || {};
      const username = user.username || user.first_name || "Anonyme";
      const userId = user.id || "inconnu";

      const order = {
        id: Date.now(),
        timestamp: new Date().toLocaleString('fr-FR'),
        username: username,
        userId: userId,
        items: cart.map(item => ({
          name: item.name,
          weight: item.weight,
          price: item.price
        })),
        total: parseFloat(total)
      };

      const token = prompt("Token GitHub (pour enregistrer la commande) :");
      if (!token) {
        alert("Token requis pour valider !");
        return;
      }

      try {
        // Récupère SHA existant
        const shaRes = await fetch('https://api.github.com/repos/maxirmeee-code/telegram-shop-miniapp/contents/web/orders.json', {
          headers: { 'Authorization': `token ${token}` }
        });

        let sha = null;
        let orders = [];

        if (shaRes.ok) {
          const data = await shaRes.json();
          sha = data.sha;
          const content = atob(data.content);
          orders = JSON.parse(content);
        }

        orders.push(order);

        const content = btoa(unescape(encodeURIComponent(JSON.stringify(orders, null, 2))));

        const putRes = await fetch('https://api.github.com/repos/maxirmeee-code/telegram-shop-miniapp/contents/web/orders.json', {
          method: 'PUT',
          headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `Nouvelle commande de @${username}`,
            content: content,
            sha: sha
          })
        });

        if (putRes.ok) {
          alert("Commande validée ! Enregistrée dans l'admin.");
          toggleCartPopup();
          cart = [];
          updateCartIcon();
        } else {
          const err = await putRes.json();
          alert(`Erreur GitHub: ${err.message}`);
        }
      } catch (err) {
        alert("Erreur réseau. Vérifie ta connexion.");
        console.error(err);
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
    fetch('/api/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: Telegram.WebApp.initData })
    })
    .then(r => r.json())
    .then(data => {
      if (data.valid) {
        document.querySelector('.cat-btn[data-cat="all"]')?.click();
        Telegram.WebApp.ready();
      }
    })
    .catch(() => {
      document.querySelector('.cat-btn[data-cat="all"]')?.click();
    });
  } else {
    document.querySelector('.cat-btn[data-cat="all"]')?.click();
  }
});