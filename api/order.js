// api/order.js – DEBUG + GEN NUMÉRO
export default async function handler(req, res) {
  console.log("API order appelée"); // ← DEBUG 1
  if (req.method !== 'POST') {
    console.log("Méthode non POST");
    return res.status(405).end();
  }

  const { order } = req.body;
  console.log("Order reçu:", order); // ← DEBUG 2
  if (!order?.items?.length) return res.status(400).json({ error: "Panier vide" });

  const token = process.env.GITHUB_TOKEN;
  console.log("Token présent:", token ? "Oui" : "NON"); // ← DEBUG 3
  if (!token) return res.status(500).json({ error: "Token manquant" });

  try {
    const now = new Date();
    const orderNumber = `CMD-${now.toISOString().slice(2,10).replace(/-/g,'')}-${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
    console.log("Numéro généré:", orderNumber); // ← DEBUG 4

    const fullOrder = {
      orderNumber,
      timestamp: now.toLocaleString('fr-FR'),
      username: order.username || "Anonyme",
      userId: order.userId || "inconnu",
      items: order.items,
      total: order.total
    };

    console.log("Full order:", fullOrder); // ← DEBUG 5

    // Récup SHA
    const fileRes = await fetch("https://api.github.com/repos/maxirmeee-code/telegram-shop-miniapp/contents/web/orders.json", {
      headers: { Authorization: `token ${token}`, "User-Agent": "shop" }
    });
    console.log("Réponse GitHub:", fileRes.status); // ← DEBUG 6

    let sha = null;
    let orders = [];
    if (fileRes.ok) {
      const data = await fileRes.json();
      sha = data.sha;
      orders = JSON.parse(atob(data.content));
    } else if (fileRes.status === 404) {
      console.log("orders.json n'existe pas → création");
      orders = [];
    } else {
      console.log("Erreur GitHub:", fileRes.status);
      return res.status(500).json({ error: "GitHub erreur" });
    }

    orders.push(fullOrder);

    const content = btoa(unescape(encodeURIComponent(JSON.stringify(orders, null, 2))));

    const putRes = await fetch("https://api.github.com/repos/maxirmeee-code/telegram-shop-miniapp/contents/web/orders.json", {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "shop"
      },
      body: JSON.stringify({ message: `Commande ${orderNumber}`, content, sha })
    });

    console.log("PUT GitHub:", putRes.status); // ← DEBUG 7

    if (putRes.ok) {
      res.status(200).json({ success: true, orderNumber });
    } else {
      console.log("PUT erreur:", await putRes.text());
      res.status(500).json({ error: "Écriture GitHub échouée" });
    }
  } catch (err) {
    console.error("Erreur globale:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}