// api/order.js – VERSION ULTRA-SIMPLE QUI MARCHE TOUJOURS DANS TELEGRAM
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { username, userId, items, total } = req.body;
  if (!items || items.length === 0) return res.status(400).json({ error: "Panier vide" });

  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(500).json({ error: "Token manquant" });

  try {
    const now = new Date();
    const orderNumber = `CMD-${now.toISOString().slice(2,10).replace(/-/g,'')}-${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;

    const fullOrder = {
      orderNumber,
      timestamp: now.toLocaleString('fr-FR'),
      username: username || "Anonyme",
      userId: userId || "inconnu",
      items,
      total
    };

    // Récupère orders.json
    const fileRes = await fetch("https://api.github.com/repos/maxirmeee-code/telegram-shop-miniapp/contents/web/orders.json", {
      headers: { Authorization: `token ${token}` }
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
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: `Commande ${orderNumber}`, content, sha })
    });

    res.json({ success: true, orderNumber });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}