// web/script.js – VERSION ULTRA PRO : caddie en haut à droite + pop-up panier
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('products');
  let cart = [];  

// === PRODUITS (tes produits actuels) ===
  const products = [
    {
      name: "Mousseux Premium Yamal",
      description: "Résine premium Yamal",
      image: "images/yamal.png",
      category: "Hash",
      options: [
        { weight: "1g8", price: 10 },
        { weight: "5g", price: 25 },
        { weight: "10g", price: 50 },
        { weight: "50g", price: 150 },
        { weight: "100g", price: 300 }
      ]
    },
    {
      name: "Amnésia",
      description: "Fleurs NL 100% HOLLANDE",
      image: "https://image.noelshack.com/fichiers/2025/46/4/1763049224-gelato-cannabis-strain.jpg",
      category: "Fleurs", // ← j'ai remis "Fleurs" simple pour que ça marche direct
      options: [
        { weight: "1g2", price: 10 },
        { weight: "5g", price: 30 },
        { weight: "10g", price: 55 }
      ]
    },
    {
      name: "Spali Runtz",
      description: "Fleurs californienne cultivée en Espagne",
      image: "images/runtz.png",
      category: "Fleurs",
      options: [
        { weight: "1g", price: 10 },
        { weight: "2g3", price: 20 },
        { weight: "5g", price: 40 },
        { weight: "10g", price: 75 },
        { weight: "20g", price: 130 }
      ]
    },
    {
      name: "LA Mousse Plus 2026",
      description: "Résine marocaine très bonne qualitée en pénurie",
      image: "images/mousseplus.png",
      category: "Hash",
      options: [
        { weight: "1g6", price: 10 },
        { weight: "5g", price: 30 },
        { weight: "10g", price: 55 },
        { weight: "25g", price: 105 },
        { weight: "50g", price: 180 },
        { weight: "100g", price: 350 }
      ]
    } // ← VIRGULE SUPPRIMÉE ICI (c’est le dernier donc pas besoin)
  ];  

// === AJOUT AU PANIER ===
  window.addToCart = (name, weight, price) => {
    cart.push({ name, weight, price });
    updateCartIcon();
    Telegram.WebApp.HapticFeedback?.impactOccurred('light');
  };  window.removeFromCart = (i) => {
    cart.splice(i, 1);
    updateCartIcon();
    renderCartPopup(); // si le panier est ouvert
  };  
// === ICÔNE CADDIE EN HAUT À DROITE ===
  const createCartIcon = () => {
    const icon = document.createElement('div');
    icon.id = 'cart-icon';
    icon.innerHTML = Shopping Cart<span id="cart-count">${cart.length}</span>;
    icon.onclick = toggleCartPopup;
    document.body.appendChild(icon);
  };  const updateCartIcon = () => {
    const count = document.getElementById('cart-count');
    if (count) count.textContent = cart.length;
  };  // === POP-UP PANIER ===
  const toggleCartPopup = () => {
    let popup = document.getElementById('cart-popup');
    if (popup) {
      popup.remove();
      return;
    }
    renderCartPopup();
  };  const renderCartPopup = () => {
    document.getElementById('cart-popup')?.remove();if (cart.length === 0) return;

const total = cart.reduce((s, i) => s + i.price, 0).toFixed(2);
const popup = document.createElement('div');
popup.id = 'cart-popup';
popup.innerHTML = `
  <div class="popup-header">
    <strong>Panier (${cart.length})</strong>
    <button onclick="toggleCartPopup()" style="background:none;border:none;font-size:20px;color:white;">×</button>
  </div>
  <div class="popup-items">
    ${cart.map((item, i) => `
      <div style="display:flex;justify-content:space-between;align-items:center;margin:10px 0;">
        <div>
          <strong>${item.name}</strong>

          <small>${item.weight} → ${item.price}€</small>
        </div>
        <button onclick="removeFromCart(${i})" style="background:red;color:white;border:none;padding:5px 10px;border-radius:50%;">×</button>
      </div>
    `).join('')}
  </div>
  <div class="popup-footer">
    <strong>Total : ${total}€</strong>
    <button id="checkout-btn-popup" style="width:100%;padding:14px;background:#25D366;color:white;border:none;border-radius:12px;font-size:16px;">
      Valider la commande
    </button>
  </div>
`;
document.body.appendChild(popup);

document.getElementById('checkout-btn-popup')?.addEventListener('click', () => {
  window.location.href = "https://telegram-shop-miniapp-networks.vercel.app/";
});  };  
// === AFFICHAGE PRODUIT ===
  const showProduct = (p) => {
    const div = document.createElement('div');
    div.className = 'product-card';
    div.dataset.cat = p.category;
    div.innerHTML =       <img src="${p.image}" alt="${p.name}" style="width:100%;border-radius:12px;">       <h3>${p.name}</h3>       <p>${p.description}</p>       <div class="options" style="display:flex;flex-wrap:wrap;gap:10px;margin-top:10px;">         ${p.options.map(o =>
          <button class="add-btn" onclick="addToCart('${p.name.replace(/'/g, "\\'")}', '${o.weight}', ${o.price})">
            ${o.weight} → ${o.price}€
          </button>
        ).join('')}       </div>     ;
    container.appendChild(div);
  };  
// === FILTRE CATÉGORIES ===
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      container.innerHTML = '<h2 style="text-align:center;margin:20px 0;">NOS PRODUITS</h2>';
      const filtered = btn.dataset.cat === 'all' ? products : products.filter(p => p.category === btn.dataset.cat);
      filtered.forEach(showProduct);
    };
  });  

// === LANCEMENT ===
  createCartIcon();
  updateCartIcon();  if (window.Telegram?.WebApp?.initData) {
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

