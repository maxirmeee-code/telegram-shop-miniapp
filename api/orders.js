// api/orders.js – Lecture Upstash pour admin
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const orders = (await redis.get('orders')) || [];
  res.json(orders);
}