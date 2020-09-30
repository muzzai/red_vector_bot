require('dotenv').config({ path: './config.env' });
const faker = require('faker');
const mongoose = require('mongoose');
const session = require('telegraf/session');
const Telegraf = require('telegraf');
const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');
const Stage = require('telegraf/stage');
const Question = require('./models/agenda');
const moment = require('moment');
const agendaScene = require('./scenes/agendaScene');
const Group = require('./models/group');
const mainScene = require('./scenes/mainScene');
const addQuestionScene = require('./scenes/addQuestionScene');
const createMeetingScene = require('./scenes/createMeeting');
const administartionScene = require('./scenes/groupAdministrationScene');

const { enter, leave } = Stage;

mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
});

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(session());

const stage = new Stage([
  agendaScene,
  mainScene,
  addQuestionScene,
  createMeetingScene,
  administartionScene,
]);
bot.use(stage.middleware());
bot.command('/agenda', (ctx) => ctx.scene.enter('agenda'));
bot.command('/main', (ctx) => ctx.scene.enter('main'));
bot.start((ctx) => {
  ctx.session.username = ctx.update.message.from.username;
  ctx.reply(`
    Сначала выбираем группу,
    потом создаём или выбираем встречу
    чтобы ответить на вопросы надо нажать "к вопросам", перейти к нужному вопросу и напечатать боту ответ
    
  `);
  ctx.scene.enter('main');
});
// bot.hears(/.+/, (ctx) => {
//   const group = ctx.message
//   ctx.reply
// })

// ['cool group', 'first group'].forEach((x) => {
//   Group.create({
//     groupName: x,
//     members: ['cheshskiychel'],
//     dates: ['6.12.2020 21:00', '7.12.2020 21:00'].map((x) => ({
//       shownDate: x,
//       date: new Date(`${x} GMT`),
//     })),
//   });
// });

// const groups = ['clpo', 'cool group', 'first group'];
// const shownDates = ['6.12.2020 21:00 GMT', '7.12.2020 21:00 GMT'];

// const getRandomInt = (max) => Math.floor(Math.random() * max);
// const arr = Array(10)
//   .fill()
//   .map((x) => {
//     const shownDate = shownDates[getRandomInt(2)];
//     return Question.create({
//       shownDate: shownDate,
//       date: new Date(shownDate),
//       group: groups[getRandomInt(3)],
//       rating: 0,
//       votes: [],
//       name: faker.lorem.sentence(),
//       description: faker.lorem.paragraph(),
//       actualTo: faker.date.future(),
//       opinions: [],
//       total: '',
//       formulation: faker.lorem.words(),
//     });
//   });
// Group.create({ groupName: 'Admins', members: ['cheshskiychel'], dates: [] });
// Promise.all(arr);
bot.launch();
