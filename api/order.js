// api/order.js – UPSTASH REDIS (remplace KV)
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { username, userId, items, total } = req.body;
  if (!items?.length) return res.status(400).json({ error: "Panier vide" });

  try {
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

    // Écriture instantanée dans Redis
    const orders = (await redis.get('orders')) || [];
    orders.push(order);
    await redis.set('orders', orders);

    res.json({ success: true, orderNumber });
  } catch (err) {
    res.status(500).json({ error: "Erreur Upstash" });
  }
}