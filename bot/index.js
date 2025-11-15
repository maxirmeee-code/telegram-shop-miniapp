require('dotenv').config();
const { Telegraf } = require('telegraf');
const express = require('express');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();
const PORT = process.env.PORT || 3000;

// COMMANDE /start → ENVOIE LE BOUTON
bot.start((ctx) => {
  ctx.reply('🛍️ Bienvenue dans la boutique !', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Ouvrir la boutique',
            web_app: { url: process.env.WEB_APP_URL }
          }
        ]
      ]
    }
  });
});

// Lancer le bot
bot.launch();
console.log('Bot démarré');

// Webhook pour Vercel
app.use(bot.webhookCallback('/webhook'));
app.get('/', (req, res) => res.send('Bot en ligne'));

app.listen(PORT, () => {
  console.log(Serveur sur le port ${PORT});
});
