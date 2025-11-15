// api/validate.js
import crypto from 'crypto';

// Remplace par le vrai token de ton bot (@BotFather)
const BOT_TOKEN = '8303829915:AAFAG7oTiNHuIzfpuj0Qe_-8Xvw_Wrpfrq0'; // ← METS TON TOKEN ICI

export default function handler(req, res) {
  // Autoriser seulement POST
  if (req.method !== 'POST') {
    return res.status(405).json({ valid: false, error: 'Method not allowed' });
  }

  const { initData } = req.body;

  if (!initData) {
    return res.status(400).json({ valid: false, error: 'No initData' });
  }

  try {
    // Extraire les paires clé=valeur sauf "hash"
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');

    const dataCheckString = Array.from(params.entries())
      .map(([key, value]) => ${key}=${value})
      .sort()
      .join('\n');

    // Générer la clé secrète
    const secretKey = crypto.createHash('sha256').update(BOT_TOKEN).digest();
    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    const isValid = computedHash === hash;

    // Répondre
    res.status(200).json({ valid: isValid });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ valid: false, error: 'Server error' });
  }
}

// Pour Vercel : activer CORS
export const config = {
  api: {
    bodyParser: true,
  },
};