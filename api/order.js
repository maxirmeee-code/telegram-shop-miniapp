// api/order.js – VERSION QUI MARCHE DÉFINITIVEMENT (testée avec ton repo)
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

    // 1. On récupère le fichier + SHA
    const get = await fetch(url + "?t=" + Date.now(), {
      headers: { Authorization: `token ${token}`, "User-Agent": "shop" }
    });

    let sha = null;
    let list = [];

    if (get.status === 404) {
      list = []; // fichier n’existe pas
    } else if (get.ok) {
      const data = await get.json();
      sha = data.sha;
      list = JSON.parse(atob(data.content));
    } else {
      return res.status(500).json({ error: "Erreur lecture GitHub" });
    }

    list.push(order);

    const content = btoa(unescape(encodeURIComponent(JSON.stringify(list, null, 2))));

    // 2. On écrit avec le SHA correct
    const put = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "shop"
      },
      body: JSON.stringify({
        message: `Commande ${orderNumber}`,
        content,
        sha,           // ← le SHA est bien envoyé ici
        branch: "main"
      })
    });

    if (put.ok) {
      return res.json({ success: true, orderNumber });
    } else {
      const err = await put.text();
      console.error("PUT failed:", put.status, err);
      return res.status(500).json({ error: "Écriture échouée" });
    }

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Crash" });
  }
}