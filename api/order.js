// api/order.js – VERSION QUI MARCHE À 100% AVEC GITHUB (17/11/2025)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { username, userId, items, total } = req.body;
  if (!items?.length) return res.status(400).json({ error: "Panier vide" });

  const token = process.env.GITHUB_TOKEN;
  if (!token?.startsWith('ghp_')) return res.status(500).json({ error: "Token invalide" });

  const now = new Date();
  const orderNumber = `CMD-${now.toISOString().slice(2,10).replace(/-/g,'')}-${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;

  const order = {
    orderNumber,
    timestamp: now.toLocaleString('fr-FR'),
    username: username || "Anonyme",
    userId: userId || "inconnu",
    items,
    total
  };

  try {
    const url = "https://api.github.com/repos/maxirmeee-code/telegram-shop-miniapp/contents/web/orders.json";

    // Lecture du fichier
    const get = await fetch(url, {
      headers: { Authorization: `token ${token}`, "User-Agent": "shop" }
    });

    let sha = null;
    let list = [];

    if (get.status === 404) {
      list = [];
    } else if (get.ok) {
      const data = await get.json();
      sha = data.sha;
      list = JSON.parse(atob(data.content));
    } else {
      return res.status(500).json({ error: "GitHub lecture échouée" });
    }

    list.push(order);

    const content = btoa(unescape(encodeURIComponent(JSON.stringify(list, null, 2))));

    const put = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "shop"
      },
      body: JSON.stringify({
        message: `Nouvelle commande ${orderNumber}`,
        content,
        sha,
        branch: "main"
      })
    });

    if (put.ok) {
      return res.json({ success: true, orderNumber });
    } else {
      const err = await put.text();
      console.error("GitHub error:", put.status, err);
      return res.status(500).json({ error: "Écriture GitHub échouée" });
    }

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Crash" });
  }
}