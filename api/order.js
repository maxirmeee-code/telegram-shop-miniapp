// api/order.js – FIXED : HMAC validation + CORS pour Telegram
import crypto from 'crypto';

export default async function handler(req, res) {
  // CORS pour Telegram
  res.setHeader('Access-Control-Allow-Origin', 'https://web.telegram.org');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).end();

  const { order, initData } = req.body;
  if (!order?.items?.length) return res.status(400).json({ error: "Panier vide" });

  // VALIDATION HMAC initData (obligatoire pour Telegram)
  const botToken = process.env.BOT_TOKEN; // Ajoute ton BOT_TOKEN dans Vercel
  if (!botToken) return res.status(500).json({ error: "Bot token manquant" });

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');

    const dataCheckString = Array.from(params.entries())
      .map(([key, value]) => `${key}=${value}`)
      .sort()
      .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (computedHash !== hash) return res.status(403).json({ error: "Validation Telegram échouée" });
  } catch (err) {
    return res.status(403).json({ error: "initData invalide" });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(500).json({ error: "Token GitHub manquant" });

  try {
    const now = new Date();
    const orderNumber = `CMD-${now.toISOString().slice(2,10).replace(/-/g,'')}-${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;

    const fullOrder = {
      orderNumber,
      timestamp: now.toLocaleString('fr-FR'),
      username: order.username || "Anonyme",
      userId: order.userId || "inconnu",
      items: order.items,
      total: order.total
    };

    // Récupère orders.json
    const fileRes = await fetch("https://api.github.com/repos/maxirmeee-code/telegram-shop-miniapp/contents/web/orders.json", {
      headers: { Authorization: `token ${token}`, "User-Agent": "shop" }
    });

    let sha = null;
    let orders = [];
    if (fileRes.ok) {
      const data = await fileRes.json();
      sha = data.sha;
      orders = JSON.parse(atob(data.content));
    } else if (fileRes.status === 404) {
      orders = [];
    } else {
      return res.status(500).json({ error: "GitHub erreur" });
    }

    orders.push(fullOrder);

    const content = btoa(unescape(encodeURIComponent(JSON.stringify(orders, null, 2))));

    const putRes = await fetch("https://api.github.com/repos/maxirmeee-code/telegram-shop-miniapp/contents/web/orders.json", {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "shop"
      },
      body: JSON.stringify({ message: `Commande ${orderNumber}`, content, sha })
    });

    if (putRes.ok) {
      res.status(200).json({ success: true, orderNumber });
    } else {
      res.status(500).json({ error: "Écriture GitHub échouée" });
    }
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
}