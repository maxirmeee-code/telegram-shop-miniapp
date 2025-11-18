// api/order.js – FIXED RÉSEAU : No retry + timeout 5s (Upstash 2025)
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || undefined,
  retry: false,  // ← DÉSACTIVE LE RETRY AUTO (fix 5s hang)
  connectTimeout: 5000,  // ← Timeout 5s
  commandTimeout: 5000
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

    // Écriture avec timeout
    await redis.set('orders', order);  // ← Simple set (pas de get/set complexe)

    res.json({ success: true, orderNumber });
  } catch (err) {
    console.error("Redis error:", err.message);
    res.status(500).json({ error: "Erreur Redis – réessaie" });
  }
}