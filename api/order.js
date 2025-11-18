// api/order.js – VERSION QUI MARCHE TOUJOURS (github_pat + contents:write)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { username, userId, items, total } = req.body;
  if (!items?.length) return res.status(400).json({ error: "Panier vide" });

  const token = process.env.GITHUB_TOKEN;
  const repo = "maxirmeee-code/telegram-shop-miniapp";
  const path = "web/orders.json";

  const now = new Date();
  const orderNumber = `CMD-${now.toISOString().slice(2,10).replace(/-/g,'')}-${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;

  const order = { orderNumber, timestamp: now.toLocaleString('fr-FR'), username: username || "Anonyme", userId: userId || "inconnu", items, total };

  try {
    // Lecture
    const get = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      headers: { Authorization: `token ${token}`, "User-Agent": "shop" }
    });

    let sha = null;
    let list = [];

    if (get.ok) {
      const data = await get.json();
      sha = data.sha;
      list = JSON.parse(atob(data.content));
    } // si 404 → list reste vide

    list.push(order);
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(list, null, 2))));

    // Écriture
    const put = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      method: "PUT",
      headers: { Authorization: `token ${token}`, "User-Agent": "shop", "Content-Type": "application/json" },
      body: JSON.stringify({ message: `Commande ${orderNumber}`, content, sha, branch: "main" })
    });

    if (put.ok) {
      res.json({ success: true, orderNumber });
    } else {
      res.status(500).json({ error: "GitHub erreur" });
    }
  } catch (err) {
    res.status(500).json({ error: "Crash" });
  }
}