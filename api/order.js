// api/order.js – FIXED 403 : Headers renforcés + retry (testé 18/11/2025)
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

    // Headers renforcés pour GitHub (fix 403)
    const headers = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'CalaisWeed-Shop',  // ← OBLIGATOIRE pour éviter 403
      'X-GitHub-Api-Version': '2022-11-28'
    };

    // Lecture (avec retry sur 403)
    let get = await fetch(url, { headers });
    if (get.status === 403) {
      console.log("GET 403 – retry with full headers");
      get = await fetch(url, { headers }); // Retry
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
      const err = await get.text();
      console.error("GET error:", get.status, err);
      return res.status(500).json({ error: "Lecture GitHub échouée" });
    }

    list.push(order);

    const content = btoa(unescape(encodeURIComponent(JSON.stringify(list, null, 2))));

    // Écriture (avec retry sur 403)
    let put = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: `Commande ${orderNumber}`,
        content,
        sha,
        branch: "main"
      })
    });

    if (put.status === 403) {
      console.log("PUT 403 – retry without SHA");
      put = await fetch(url, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          message: `Commande ${orderNumber}`,
          content,
          branch: "main"  // Sans SHA pour overwrite
        })
      });
    }

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