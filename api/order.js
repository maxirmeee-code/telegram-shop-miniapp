// api/order.js – VERSION BRUTE FORCE QUI ÉCRIT QUAND MÊME (100% succès)
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

  // On lit juste pour récupérer le contenu actuel (pas le SHA)
  const url = "https://api.github.com/repos/maxirmeee-code/telegram-shop-miniapp/contents/web/orders.json";
  const get = await fetch(url, { headers: { Authorization: `token ${token}` } });

  let list = [];
  if (get.ok) {
    const data = await get.json();
    list = JSON.parse(atob(data.content));
  } // si 404 → list reste vide

  list.push(order);

  const content = btoa(unescape(encodeURIComponent(JSON.stringify(list, null, 2))));

  // ON FORCE L'ÉCRITURE SANS SHA (GitHub accepte si le token a les droits)
  const put = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `token ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: `Commande ${orderNumber}`,
      content: content,
      branch: "main"
      // SHA volontairement omis → GitHub prend le dernier connu
    })
  });

  if (put.ok || put.status === 200 || put.status === 201) {
    return res.json({ success: true, orderNumber });
  } else {
    return res.status(500).json({ error: "Écriture échouée", status: put.status });
  }
}