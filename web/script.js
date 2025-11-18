// web/script.js – VERSION MINIMALE QUI MARCHE TOUJOURS (testée 18/11/2025)
let cart = JSON.parse(localStorage.getItem("cart") || "[]");

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("products");

  // CHARGE PRODUITS
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

  // FONCTIONS PANIER
  window.addToCart = (name, weight, price) => {
    cart.push({name, weight, price});
    localStorage.setItem("cart", JSON.stringify(cart));
    document.getElementById("cart-count").textContent = cart.length;
    Telegram.WebApp?.HapticFeedback?.impactOccurred("light");
  };

  // ICÔNE PANIER
  if (!document.getElementById("cart-icon")) {
    const icon = document.createElement("div");
    icon.id = "cart-icon";
    icon.innerHTML = `Panier <span id="cart-count">${cart.length}</span>`;
    icon.style.cssText = "position:fixed;top:15px;right:15px;background:#25D366;color:white;padding:10px 16px;border-radius:50px;z-index:1000;cursor:pointer;font-weight:bold;";
    icon.onclick = () => {
      document.getElementById("cart-popup")?.remove();
      if (cart.length === 0) return;

      const total = cart.reduce((a,b) => a + b.price, 0);
      const popup = document.createElement("div");
      popup.id = "cart-popup";
      popup.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:flex-end;z-index:9999;";
      popup.innerHTML = `
        <div style="background:white;width:100%;border-radius:20px 20px 0 0;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <h3>Panier (${cart.length})</h3>
            <button onclick="document.getElementById('cart-popup').remove()" style="font-size:28px;background:none;border:none;">×</button>
          </div>
          ${cart.map((it,i)=>`<div style="display:flex;justify-content:space-between;padding:10px 0;">
            <div><b>${it.name}</b><br><small>${it.weight} → ${it.price}€</small></div>
            <button onclick="cart.splice(${i},1);localStorage.setItem('cart',JSON.stringify(cart));document.getElementById('cart-count').textContent=cart.length;this.closest('div').remove()" style="background:#e74c3c;color:white;border:none;width:30px;height:30px;border-radius:50%;">×</button>
          </div>`).join("")}
          <div style="text-align:center;font-size:22px;font-weight:bold;margin:25px 0;">Total : ${total} €</div>
          <button id="go-pay" style="width:100%;padding:16px;background:#25D366;color:white;border:none;border-radius:12px;font-size:18px;font-weight:bold;">
            Valider la commande
          </button>
        </div>
      `;
      document.body.appendChild(popup);
    };
    document.body.appendChild(icon);
  }

  // COMMANDE
  document.addEventListener("click", async e => {
    if (e.target.id !== "go-pay") return;
    if (cart.length === 0) return alert("Panier vide");

    const user = Telegram.WebApp.initDataUnsafe?.user || {};
    const payload = {
      username: user.username || user.first_name || "Anonyme",
      userId: user.id || "inconnu",
      items: cart,
      total: cart.reduce((a,b) => a + b.price, 0)
    };

    const res = await fetch("/api/order", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      alert("Commande validée !\!\n\nNuméro : " + data.orderNumber);
      window.location.href = "https://telegram-shop-miniapp.vercel.app/networks/?order=" + data.orderNumber;
      cart = [];
      localStorage.setItem("cart", "[]");
      document.getElementById("cart-count").textContent = "0";
      document.getElementById("cart-popup")?.remove();
    } else {
      alert("Erreur : " + (data.error || "serveur"));
    }
  });

  Telegram.WebApp?.ready();
});