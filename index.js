require('dotenv').config({ path: './config.env' });

const mongoose = require('mongoose');
const session = require('telegraf/session');
const Telegraf = require('telegraf');
const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');
const Stage = require('telegraf/stage');

const Agenda = require('./models/agenda');
const moment = require('moment');
const Scene = require('telegraf/scenes/base');
const collector = {};
const getAgendaForDate = require('./scenes/agendaScene');

const { enter, leave } = Stage;

const today = moment().format('l');
mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
});

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.command('/help', (ctx) => {
  ctx.reply(`
    Список комманд:
    /agenda - повестка ближайшего собрания
    /agendaOn дд.мм.гг - повестка собрания по указанной дате
    /agendaAdd - добавить вопрос в повестку предстоящего собрания
  `);
});
const agendaScene = new Scene('Agenda Scene');
// bot.command('/testScene', (ctx) => {
//   ctx.scene.enter('Agenda Scene');
// });

const greeterScene = new Scene('greeter');
greeterScene.enter((ctx) => ctx.reply('Hi'));
greeterScene.leave((ctx) => ctx.reply('Bye'));
greeterScene.hears('hi', enter('greeter'));
greeterScene.on('message', (ctx) => ctx.replyWithMarkdown('Send `hi`'));

bot.use(session());

// agendaScene.enter((ctx) => {
//   ctx.session.myData = 0;
//   ctx.reply(
//     Markup.inlineKeyboard([
//       Markup.callbackButton('+1', 'inc'),
//       Markup.callbackButton('-1', 'dec'),
//     ]).extra()
//   );
// });

// agendaScene.action('inc', (ctx) => {
//   ctx.session.myData += 1;
//   ctx.reply(ctx.session.myData);
// });

// agendaScene.action('dec', (ctx) => {
//   ctx.session.myData -= 1;
//   ctx.reply(ctx.session.myData);
// });

// agendaScene.action('exit', agendaScene.leave());

const stage = new Stage([greeterScene], { ttl: 10 });
bot.use(stage.middleware());
bot.command('/agenda', async (ctx) => {
  const agenda = await Agenda.findOne({ date: { $lte: Date.now() } });
  console.log(agenda);
});

// Agenda.create({
//   shownDate: '15.11.2020',
//   date: Date('15.11.2020'),
//   group: 'All',
//   agendaItems: [
//     {
//       rating: 5,
//       name: 'Создать более удобный механизм голосования',
//       description: `Во время созвона кураторов нам часто приходится опрашивать всех кураторов - согласен или не согласен с каким то положением.
//       Имеет смысл создать единую платформу для голосований. Что бы не опрашивать каждого куратора, а сразу собрать все мнения. На ней создавать по каждому спорному вопросы повестки голосование из 4х пунктов (Согласен, не согласен, Воздержусь, Свой вариант)
//       `,
//       actualTo: Date.now(),
//       opinions: [
//         { opinion: 'Согласен', user: 'Вася' },
//         { opinion: 'не Согласен', user: 'Петя' },
//       ],
//       total: '',
//       formulation: `1) Стоит ли делать такой механизм?
//       2) Какую платформу вы видите как оптимальную для такого механизма?`,
//     },
//     {
//       rating: 5,
//       name: 'Нужно найти допп место для занятий кружков',
//       description: `
//       Так как в следующем наборе у нас будет +20-30 новых кураторов, нам нужно будет найти новые помещение/ния для проведения кружков. Предлагаю провести опрос среди кружковцев - есть ли у них варианты.
//       Если таких вариантов не будет, то списаться с КПРФ, ОКП и иже с ними спросить смогут ли они нам помочь.
//       `,
//       actualTo: Date.now(),
//       opinions: [
//         { opinion: 'Согласен', user: 'Вася' },
//         { opinion: 'не Согласен', user: 'Петя' },
//       ],
//       total: '',
//       formulation: `Вопрос Кто готов взяться за это?`,
//     },
//   ],
// }).catch((err) => console.log(err));

bot.launch();
