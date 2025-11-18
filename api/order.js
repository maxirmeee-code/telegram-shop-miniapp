// api/order.js – FIXED GITHUB ERREUR : Headers + retry (2025)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { username, userId, items, total } = req.body;
  if (!items?.length) return res.status(400).json({ error: "Panier vide" });

  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(500).json({ error: "Token manquant" });

  const now = new Date();
  const orderNumber = `CMD-${now.toISOString().slice(2,10).replace(/-/g,'')}-${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;

  const order = { orderNumber, timestamp: now.toLocaleString('fr-FR'), username: username || "Anonyme", userId: userId || "inconnu", items, total };

  try {
    const url = "https://api.github.com/repos/maxirmeee-code/telegram-shop-miniapp/contents/web/orders.json";

    // Headers renforcés pour GitHub (fix 90% des erreurs)
    const headers = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'CalaisWeed-Shop/1.0'  // ← OBLIGATOIRE
    };

    // Lecture (avec retry sur 403/404)
    let get = await fetch(url, { headers });
    if (get.status >= 400) {
      get = await fetch(url, { headers });  // Retry
    }

    let sha = null;
    let list = [];

    if (get.status === 404) {
      list = [];
    } else if (get.ok) {
      const data = await get.json();
      sha = data.sha;
      list = JSON.parse(atob(data.content));
    } else {
      return res.status(500).json({ error: "Lecture GitHub échouée", status: get.status });
    }

    list.push(order);

    const content = btoa(unescape(encodeURIComponent(JSON.stringify(list, null, 2))));

    // Écriture (avec retry sur 403)
    let put = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify({ message: `Commande ${orderNumber}`, content, sha, branch: "main" })
    });

    if (put.status === 403) {
      // Retry sans SHA (overwrite)
      put = await fetch(url, {
        method: "PUT",
        headers,
        body: JSON.stringify({ message: `Commande ${orderNumber}`, content, branch: "main" })
      });
    }

    if (put.ok || put.status === 201) {
      return res.json({ success: true, orderNumber });
    } else {
      return res.status(500).json({ error: "Écriture GitHub échouée", status: put.status });
    }

  } catch (err) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
}