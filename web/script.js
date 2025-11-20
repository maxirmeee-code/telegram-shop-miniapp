// web/script.js – VERSION QUI MARCHE À 100% DANS TELEGRAM (corrigée 18/11/2025)
let cart = [];

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("products");

  // Charge produits
  fetch("/products.json")
    .then(r => r.json())
    .then(data => {
      data.forEach(p => {
        const div = document.createElement("div");
        div.className = "product-card";
        div.innerHTML = `
          <img src="${p.image}" style="width:100%;height:180px;object-fit:cover;border-radius:12px;">
          <h3>${p.name}</h3>
          <p>${p.description}</p>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;">
            ${p.options.map(o => `<button onclick="addToCart('${p.name.replace(/'/g,"\\'")}', '${o.weight}', ${o.price})" style="background:#25D366;color:white;border:none;padding:8px 12px;border-radius:8px;">${o.weight} → ${o.price}€</button>`).join("")}
          </div>
        `;
        container.appendChild(div);
      });
    });

  window.addToCart = (name, weight, price) => {
    cart.push({name, weight, price});
    document.getElementById("cart-count").textContent = cart.length;
    Telegram.WebApp?.HapticFeedback?.impactOccurred("light");
  };

  // Icône panier
  if (!document.getElementById("cart-icon")) {
    const icon = document.createElement("div");
    icon.id = "cart-icon";
    icon.innerHTML = `Panier <span id="cart-count">0</span>`;
    icon.style.cssText = "position:fixed;top:15px;right:15px;background:#25D366;color:white;padding:10px 16px;border-radius:50px;z-index:1000;cursor:pointer;font-weight:bold;";
    icon.onclick = showCart;
    document.body.appendChild(icon);
  }

  function showCart() {
    document.getElementById("cart-popup")?.remove();
    if (cart.length === 0) return alert("Panier vide !");

    const total = cart.reduce((a,b) => a + b.price, 0);
    const popup = document.createElement("div");
    popup.id = "cart-popup";
    popup.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:flex-end;z-index:9999;";
    popup.innerHTML = `
      <div style="background:white;width:100%;border-radius:20px 20px 0 0;padding:20px;">
        <div style="text-align:center;font-size:20px;font-weight:bold;margin-bottom:10px;">Panier (${cart.length} article${cart.length>1?'s':''})</div>
        ${cart.map((it,i) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #eee;">
            <div><b>${it.name}</b> - ${it.weight} → ${it.price}€</div>
            <button onclick="cart.splice(${i},1);document.getElementById('cart-count').textContent=cart.length;showCart()" style="background:#e74c3c;color:white;border:none;padding:5px 10px;border-radius:8px;">Supprimer</button>
          </div>
        `).join("")}
        <div style="text-align:center;font-size:24px;font-weight:bold;margin:20px 0;color:#25D366;">Total : ${total} €</div>
        <button id="validate-now" style="width:100%;padding:16px;background:#25D366;color:white;border:none;border-radius:12px;font-size:20px;font-weight:bold;">
          VALIDER LA COMMANDE
        </button>
      </div>
    `;
    document.body.appendChild(popup);
  }

  // VALIDATION FINALE – 100% fiable
  document.addEventListener("click", async e => {
    if (e.target.id !== "validate-now") return;

    if (cart.length === 0) return alert("Panier vide !");

    const user = Telegram.WebApp.initDataUnsafe?.user || {};
    const payload = {
      username: user.username || user.first_name || "Anonyme",
      userId: user.id || "inconnu",
      items: cart,
      total: cart.reduce((a,b) => a + b.price, 0)
    };

    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        alert(`COMMANDE VALIDÉE !\n\nNuméro : ${data.orderNumber}\n\nEnvoie-le maintenant !`);
        window.location.href = `https://telegram-shop-miniapp.vercel.app/networks/?order=${data.orderNumber}`;
      } else {
        alert("Erreur serveur : " + (data.error || "inconnue"));
      }
    } catch (err) {
      alert("Erreur réseau – réessaie dans 5s");
    }
  });

  Telegram.WebApp?.ready();
});