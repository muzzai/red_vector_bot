require('dotenv').config({ path: './config.env' });
const Markup = require('telegraf/markup');
const Telegraf = require('telegraf');
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');

//incdec

const agendaScene = new Scene('test');
agendaScene.enter((ctx) => {
  ctx.session.myData = 0;
  ctx.reply(
    ctx.session.myData,
    Markup.inlineKeyboard([
      Markup.callbackButton('+1', 'inc'),
      Markup.callbackButton('-1', 'dec'),
      Markup.callbackButton('exit', 'exit'),
    ]).extra()
  );
  return;
});

agendaScene.action('inc', (ctx) => {
  ctx.session.myData += 1;
  console.log(ctx.session.myData);
  ctx.editMessageText(
    ctx.session.myData,
    Markup.inlineKeyboard([
      Markup.callbackButton('+1', 'inc'),
      Markup.callbackButton('-1', 'dec'),
      Markup.callbackButton('exit', 'exit'),
    ]).extra()
  );
  return;
});

agendaScene.action('dec', (ctx) => {
  ctx.session.myData -= 1;
  return ctx.editMessageText(
    ctx.session.myData,
    Markup.inlineKeyboard([
      Markup.callbackButton('+1', 'inc'),
      Markup.callbackButton('-1', 'dec'),
    ]).extra()
  );
});

agendaScene.action('exit', (ctx) => {
  ctx.reply('bye');
  console.log('exit');
  agendaScene.leave();
});
const bot = new Telegraf(process.env.BOT_TOKEN);
const stage = new Stage([agendaScene], { ttl: 10 });
bot.use(session());
bot.use(stage.middleware());
bot.command('test', (ctx) => ctx.scene.enter('test'));
bot.on('message', (ctx) => ctx.reply('Try /echo or /greeter'));
bot.launch();
