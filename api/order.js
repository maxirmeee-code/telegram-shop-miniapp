// api/order.js – VERSION ULTIME QUI ÉCRIT TOUJOURS (testée 17/11/2025)
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

    // Chemin EXACT vers le fichier sur GitHub
    const url = "https://api.github.com/repos/maxirmeee-code/telegram-shop-miniapp/contents/web/orders.json";

    // Récupération du fichier (avec gestion 404)
    const getRes = await fetch(url, {
      headers: { Authorization: `token ${token}`, "User-Agent": "shop" }
    });

    let sha = null;
    let orders = [];

    if (getRes.status === 404) {
      // Le fichier n’existe pas → on le crée
      orders = [];
    } else if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
      orders = JSON.parse(atob(data.content));
    } else {
      return res.status(500).json({ error: "GitHub erreur lecture" });
    }

    // Ajout de la commande
    orders.push(fullOrder);

    // Encodage propre UTF-8
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(orders, null, 2))));

    // Écriture (PUT) avec ou sans SHA
    const putRes = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "shop"
      },
      body: JSON.stringify({
        message: `Commande ${orderNumber}`,
        content,
        sha, // null si création → GitHub accepte
        branch: "main"
      })
    });

    if (putRes.ok) {
      return res.json({ success: true, orderNumber });
    } else {
      const err = await putRes.text();
      console.error("GitHub PUT error:", putRes.status, err);
      return res.status(500).json({ error: "Écriture échouée" });
    }

  } catch (err) {
    console.error("Erreur globale:", err);
    return res.status(500).json({ error: "Crash serveur" });
  }
}