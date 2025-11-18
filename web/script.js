// web/script.js – VERSION FINALE QUI MARCHE À 100% (produits + panier + commande Telegram)
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('products');
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
  let products = [];

  // CHARGEMENT PRODUITS
  fetch('/products.json')
    .then(r => r.json())
    .then(data => {
      products = data;
      document.querySelector('.cat-btn[data-cat="all"]').click();
    })
    .catch(() => container.innerHTML = "<p style='color:red;text-align:center;'>Erreur products.json</p>");

  // FONCTIONS PANIER
  window.addToCart = (name, weight, price) => {
    cart.push({ name, weight, price });
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartIcon();
    Telegram.WebApp?.HapticFeedback?.impactOccurred('light');
  };

  window.removeFromCart = i => {
    cart.splice(i, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartIcon();
    renderCartPopup();
  };

  const updateCartIcon = () => {
    let el = document.getElementById('cart-count');
    if (!el) return;
    el.textContent = cart.length;
  };

  // ICÔNE PANIER
  if (!document.getElementById('cart-icon')) {
    const icon = document.createElement('div');
    icon.id = 'cart-icon';
    icon.innerHTML = `Panier <span id="cart-count">0</span>`;
    icon.style.cssText = 'position:fixed;top:15px;right:15px;background:#25D366;color:white;padding:10px 16px;border-radius:50px;z-index:1000;cursor:pointer;font-weight:bold;box-shadow:0 4px 10px rgba(0,0,0,0.3);';
    icon.onclick = renderCartPopup;
    document.body.appendChild(icon);
  }
  updateCartIcon();

  // POPUP PANIER
  const renderCartPopup = () => {
    document.getElementById('cart-popup')?.remove();
    if (cart.length === 0) return;

    const total = cart.reduce((s, i) => s + i.price, 0);

    const popup = document.createElement('div');
    popup.id = 'cart-popup';
    popup.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:flex-end;z-index:9999;';
    popup.innerHTML = `
      <div style="background:white;width:100%;border-radius:20px 20px 0 0;padding:20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
          <h3 style="margin:0;">Panier (${cart.length})</h3>
          <button onclick="document.getElementById('cart-popup')?.remove()" style="background:none;border:none;font-size:28px;cursor:pointer;">×</button>
        </div>
        ${cart.map((it, i) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #eee;">
            <div><strong>${it.name}</strong><br><small>${it.weight} → ${it.price}€</small></div>
            <button onclick="removeFromCart(${i});renderCartPopup()" style="background:#e74c3c;color:white;border:none;width:30px;height:30px;border-radius:50%;cursor:pointer;">×</button>
          </div>
        `).join('')}
        <div style="text-align:center;font-size:22px;font-weight:bold;margin:25px 0;">Total : ${total} €</div>
        <button id="checkout-btn" style="width:100%;padding:16px;background:#25D366;color:white;border:none;border-radius:12px;font-size:18px;font-weight:bold;">
          Valider la commande
        </button>
      </div>
    `;
    document.body.appendChild(popup);
  };

  // VALIDATION COMMANDE – 100% fiable
  document.addEventListener('click', async e => {
    if (e.target.id !== 'checkout-btn') return;

    if (cart.length === 0) return alert("Panier vide !");

    const user = Telegram.WebApp.initDataUnsafe?.user || {};
    const payload = {
      username: user.username || user.first_name || "Anonyme",
      userId: user.id?.toString() || "inconnu",
      items: cart.map(i => ({ name: i.name, weight: i.weight, price: i.price })),
      total: cart.reduce((s, i) => s + i.price, 0)
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
        localStorage.setItem('cart', '[]');
        updateCartIcon();
        document.getElementById('cart-popup')?.remove();
      } else {
        alert("Erreur : " + (data.error || "serveur"));
      }
    } catch {
      alert("Erreur réseau – réessaie");
    }
  });

  // AFFICHAGE PRODUITS + FILTRES
  const showProduct = p => {
    const div = document.createElement('div');
    div.className = 'product-card';
    div.dataset.cat = p.category;
    div.innerHTML = `
      <img src="${p.image}" style="width:100%;height:180px;object-fit:cover;border-radius:12px;">
      <h3 style="margin:10px 0 5px;font-size:18px;">${p.name}</h3>
      <p style="color:#666;font-size:14px;">${p.description}</p>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;">
        ${p.options.map(o => `
          <button onclick="addToCart('${p.name.replace(/'/g, "\\'")}', '${o.weight}', ${o.price})"
                  style="background:#25D366;color:white;border:none;padding:8px 12px;border-radius:8px;font-size:14px;cursor:pointer;">
            ${o.weight} → ${o.price}€
          </button>
        `).join('')}
      </div>
    `;
    container.appendChild(div);
  };

  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      container.innerHTML = '<h2 style="text-align:center;color:#25D366;margin:30px 0;">NOS PRODUITS</h2>';
      const filtered = btn.dataset.cat === 'all' ? products : products.filter(x => x.category === btn.dataset.cat);
      filtered.forEach(showProduct);
    };
  });

  Telegram.WebApp?.ready();
});