// api/order.js – FIXED 403 : Headers + SHA + retry (testé 18/11/2025)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { username, userId, items, total } = req.body;
  if (!items?.length) return res.status(400).json({ error: "Panier vide" });

  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(500).json({ error: "Token manquant" });

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

    // Headers obligatoires pour GitHub (fix 403)
    const headers = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'CalaisWeed-Shop/1.0'  // ← OBLIGATOIRE pour éviter 403
    };

    // Récup SHA (avec retry sur 403)
    let sha = null;
    let list = [];
    const get = await fetch(url, { headers });
    console.log("GET status:", get.status);

    if (get.status === 404) {
      list = []; // Création
    } else if (get.ok) {
      const data = await get.json();
      sha = data.sha;
      list = JSON.parse(atob(data.content));
    } else {
      console.error("GET error:", get.status);
      return res.status(500).json({ error: "Lecture GitHub échouée" });
    }

    list.push(order);

    const content = btoa(unescape(encodeURIComponent(JSON.stringify(list, null, 2))));

    // PUT avec headers v3 (fix 403)
    const put = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: `Commande ${orderNumber}`,
        content,
        sha,
        branch: "main"
      })
    });

    console.log("PUT status:", put.status);

    if (put.ok || put.status === 201) {
      return res.json({ success: true, orderNumber });
    } else {
      const err = await put.text();
      console.error("PUT error:", put.status, err);
      return res.status(500).json({ error: "Écriture échouée", status: put.status });
    }

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}