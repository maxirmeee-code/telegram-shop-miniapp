// web/script.js – DERNIÈRE VERSION QUI MARCHE À COUP SÛR (20/11/2025)
let cart = []; // Plus jamais de localStorage

document.addEventListener("DOMContentLoaded", () => {
 const container = document.getElementById("products");

 // Charge produits
 fetch("/products.json")
 .then(r => r.json())
 .then(products => {
 products.forEach(p => {
 const card = document.createElement("div");
 card.className = "product-card";
 card.innerHTML = `
 <img src="${p.image}" style="width:100%;height:180px;object-fit:cover;border-radius:12px;">
 <h3>${p.name}</h3>
 <p>${p.description}</p>
 <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;">
 ${p.options.map(o => `
 <button onclick="addToCart('${p.name.replace(/'/g,"\\'")}', '${o.weight}', ${o.price})"
 style="background:#25D366;color:white;border:none;padding:10px 14px;border-radius:10px;">
 ${o.weight} → ${o.price}€
 </button>
 `).join("")}
 </div>
 `;
 container.appendChild(card);
 });
 });

 // Ajout au panier
 window.addToCart = (name, weight, price) => {
 cart.push({ name, weight, price });
 document.getElementById("cart-count").textContent = cart.length;
 Telegram.WebApp?.HapticFeedback?.impactOccurred("light");
 };

 // Icône panier
 const icon = document.createElement("div");
 icon.id = "cart-icon";
 icon.innerHTML = `Panier <span id="cart-count">0</span>`;
 icon.style.cssText = "position:fixed;top:12px;right:12px;background:#25D366;color:white;padding:12px 18px;border-radius:50px;z-index:9999;font-weight:bold;cursor:pointer;";
 icon.onclick = openCart;
 document.body.appendChild(icon);

 function openCart() {
 document.getElementById("cart-popup")?.remove();

 if (cart.length === 0) {
 alert("Panier vide !");
 return;
 }

 const total = cart.reduce((s, i) => s + i.price, 0);

 const popup = document.createElement("div");
 popup.id = "cart-popup";
 popup.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.9);display:flex;align-items:flex-end;z-index:99999;";
 popup.innerHTML = `
 <div style="background:#fff;width:100%;border-radius:20px 20px 0 0;padding:25px;">
 <h2 style="text-align:center;margin-bottom:20px;">Panier (${cart.length})</h2>
 ${cart.map((it, i) => `
 <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #eee;">
 <div><b>${it.name}</b><br>${it.weight} → ${it.price}€</div>
 <button onclick="cart.splice(${i},1);document.getElementById('cart-count').textContent=cart.length;openCart()" 
 style="background:#e74c3c;color:white;border:none;padding:8px 12px;border-radius:8px;">Supprimer</button>
 </div>
 `).join("")}
 <div style="text-align:center;font-size:26px;font-weight:bold;margin:25px 0;color:#25D366;">Total : ${total} €</div>
 <button id="send-order" style="width:100%;padding:18px;background:#25D366;color:white;border:none;border-radius:15px;font-size:22px;font-weight:bold;">
 ENVOYER LA COMMANDE
 </button>
 </div>
 `;
 document.body.appendChild(popup);
 }

 // ENVOI DE LA COMMANDE – AVEC COPIE DU PANIER (anti-vidage Telegram)
 document.addEventListener("click", async e => {
 if (e.target.id !== "send-order") return;

 const panierActuel = [...cart]; // ← copie profonde, IMPOSSIBLE À VIDER

 if (panierActuel.length === 0) {
 alert("Panier vide !");
 return;
 }

 const user = Telegram.WebApp.initDataUnsafe?.user || {};
 const payload = {
 username: user.username || user.first_name || "Anonyme",
 userId: user.id || "inconnu",
 items: panierActuel,
 total: panierActuel.reduce((s, i) => s + i.price, 0)
 };

 try {
 const res = await fetch("/api/order", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(payload)
 });
 const data = await res.json();

 if (data.success) {
 alert(`COMMANDE ENVOYÉE !\n\nNuméro : ${data.orderNumber}\n\nVa sur la page suivante`);
 window.location.href = `https://telegram-shop-miniapp.vercel.app/networks/?order=${data.orderNumber}`;
 } else {
 alert("Erreur serveur : " + (data.error || "inconnue"));
 }
 } catch {
 alert("Erreur réseau – réessaie");
 }
 });

 Telegram.WebApp?.ready();
});