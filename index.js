const TG = require('node-telegram-bot-api');

const bot = new TG('1327942449:AAEbItfYgg66YmvFXYoe8oV0LgUEalFb-ls', {
  polling: true,
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  console.log(msg);

  bot.sendMessage(chatId, 'HI!');
});
