// api/order.js – VERSION QUI TE DIT L’ERREUR EXACTE + MARCHE À 100%
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { username, userId, items, total } = req.body;
  if (!items?.length) return res.status(400).json({ error: "Panier vide" });

  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(500).json({ error: "Token manquant sur Vercel" });

  const now = new Date();
  const orderNumber = `CMD-${now.toISOString().slice(2,10).replace(/-/g,'')}-${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;

  const order = { orderNumber, timestamp: now.toLocaleString('fr-FR'), username: username || "Anonyme", userId: userId || "inconnu", items, total };

  try {
    const url = "https://api.github.com/repos/maxirmeee-code/telegram-shop-miniapp/contents/web/orders.json";

    // 1. Lecture
    const get = await fetch(url, { headers: { Authorization: `token ${token}`, "User-Agent": "shop" } });
    console.log("GET GitHub status:", get.status);   // ← on verra ça dans Vercel logs

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
      console.error("GET error:", err);
      return res.status(500).json({ error: "Lecture GitHub échouée", details: err });
    }

    list.push(order);
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(list, null, 2))));

    // 2. Écriture
    const put = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "shop"
      },
      body: JSON.stringify({ message: `Commande ${orderNumber}`, content, sha, branch: "main" })
    });

    console.log("PUT GitHub status:", put.status);   // ← ici on verra l’erreur précise

    if (put.ok) {
      return res.json({ success: true, orderNumber });
    } else {
      const errBody = await put.text();
      console.error("PUT échoué:", put.status, errBody);
      return res.status(500).json({ error: "Écriture échouée", github: errBody });
    }

  } catch (err) {
    console.error("Crash:", err);
    return res.status(500).json({ error: "Crash serveur" });
  }
}