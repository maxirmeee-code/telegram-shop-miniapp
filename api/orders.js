// api/orders.js – FIXED LECTURE : Simple get
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || undefined,
  retry: false,
  connectTimeout: 5000
});

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const orders = await redis.get('orders') || [];
    res.json(orders);
  } catch (err) {
    console.error("Lecture error:", err.message);
    res.json([]);  // Fallback vide
  }
}