// api/order.js – Enregistre la commande + génère le numéro
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { order } = req.body;
  if (!order?.items?.length) return res.status(400).json({ error: "Panier vide" });

  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(500).json({ error: "Token manquant" });

  try {
    const now = new Date();
    const orderNumber = `CMD-${now.toISOString().slice(2,10).replace(/-/g,'')}-${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;

    const fullOrder = {
      orderNumber,
      timestamp: now.toLocaleString('fr-FR'),
      username: order.username || "Anonyme",
      userId: order.userId || "inconnu",
      items: order.items,
      total: order.total
    };

    // Récupère orders.json existant
    const fileRes = await fetch("https://api.github.com/repos/maxirmeee-code/telegram-shop-miniapp/contents/web/orders.json", {
      headers: { Authorization: `token ${token}`, "User-Agent": "shop" }
    });

    let sha = null;
    let orders = [];
    if (fileRes.ok) {
      const data = await fileRes.json();
      sha = data.sha;
      orders = JSON.parse(atob(data.content));
    }

    orders.push(fullOrder);

    const content = btoa(unescape(encodeURIComponent(JSON.stringify(orders, null, 2))));

    await fetch("https://api.github.com/repos/maxirmeee-code/telegram-shop-miniapp/contents/web/orders.json", {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "shop"
      },
      body: JSON.stringify({ message: `Commande ${orderNumber}`, content, sha })
    });

    res.status(200).json({ success: true, orderNumber });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}