document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('products');
  let cart = [];

  const products = [
    {
      name: "Mousseux Premium Yamal",
      description: "Résine premium Yamal",
      image: "https://i.imgur.com/abc123.jpg",
      category: "Hash",
      options: [
        { weight: "1g8", price: 10 },
        { weight: "5g", price: 25 },
        { weight: "10g", price: 50 }
      ]
    },
    {
      name: "Amnésia",
      description: "Fleurs NL 100% HOLLANDE",
      image: "",
      category: "Fleurs",
      options: [
        { weight: "1g2", price: 10 },
        { weight: "5g", price: 30 }
      ]
    },
    {
      name: "Spali SUPER BOOF",
      description: "Fleurs californienne",
      image: "",
      category: "Fleurs",
      options: [
        { weight: "1g", price: 10 },
        { weight: "5g", price: 40 }
      ]
    },
    {
      name: "LA Mousse Plus 2026",
      description: "Résine marocaine",
      image: "",
      category: "Hash",
      options: [
        { weight: "1g6", price: 10 },
        { weight: "5g", price: 30 }
      ]
    },
    {
      name: "Coke Ecaille de Poisson",
      description: "Coke bien écaillée",
      image: "",
      category: "Chimie",
      options: [
        { weight: "0g5", price: 25 },
        { weight: "1g", price: 50 }
      ]
    }
  ];

  window.addToCart = (name, weight, price) => {
    cart.push({ name, weight, price });
    updateCartIcon();
  };

  const createCartIcon = () => {
    const icon = document.createElement('div');
    icon.id = 'cart-icon';
    icon.innerHTML = `🛒 <span id="cart-count">0</span>`;
    icon.onclick = toggleCartPopup;
    document.body.appendChild(icon);
  };

  const updateCartIcon = () => {
    const count = document.getElementById('cart-count');
    if (count) count.textContent = cart.length;
  };

  const toggleCartPopup = () => {
    let popup = document.getElementById('cart-popup');
    if (popup) { popup.remove(); return; }
    const total = cart.reduce((s, i) => s + i.price, 0);
    const popupDiv = document.createElement('div');
    popupDiv.id = 'cart-popup';
    popupDiv.style = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;';
    popupDiv.innerHTML = `
      <div style="background:white;padding:20px;border-radius:10px;max-width:400px;width:90%;">
        <h3>Panier (${cart.length})</h3>
        ${cart.map((item, i) => `<div style="display:flex;justify-content:space-between;margin:8px 0;">
          <span>${item.name} - ${item.weight} → ${item.price}€</span>
          <button onclick="cart.splice(${i},1);updateCartIcon();toggleCartPopup();toggleCartPopup();" style="background:red;color:white;border:none;padding:5px;">×</button>
        </div>`).join('')}
        <p><strong>Total: ${total}€</strong></p>
        <button onclick="toggleCartPopup()" style="background:#25D366;color:white;border:none;padding:10px;width:100%;border-radius:5px;">Fermer</button>
      </div>
    `;
    document.body.appendChild(popupDiv);
  };

  const showProduct = (p) => {
    const div = document.createElement('div');
    div.className = 'product-card';
    div.innerHTML = `
      ${p.image ? `<img src="${p.image}" style="width:100%;height:150px;object-fit:cover;border-radius:8px;">` : ''}
      <h3>${p.name}</h3>
      <p>${p.description}</p>
      <div style="display:flex;flex-wrap:wrap;gap:5px;">
        ${p.options.map(o => `<button class="add-btn" onclick="addToCart('${p.name}', '${o.weight}', ${o.price})">${o.weight} → ${o.price}€</button>`).join('')}
      </div>
    `;
    container.appendChild(div);
  };

  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      container.innerHTML = '<h2 style="text-align:center;margin:20px 0;">NOS PRODUITS</h2>';
      const filtered = btn.dataset.cat === 'all' ? products : products.filter(p => p.category === btn.dataset.cat);
      filtered.forEach(showProduct);
    };
  });

  createCartIcon();
  updateCartIcon();
  document.querySelector('.cat-btn[data-cat="all"]')?.click();
});