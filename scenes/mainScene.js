const Scene = require('telegraf/scenes/base');
const Markup = require('telegraf/markup');
const Group = require('../models/group');

const mainScene = new Scene('main');

mainScene.enter(async (ctx) => {
  const groups = await Group.find({
    members: ctx.session.username,
  });
  console.log(ctx.session.username);
  if (groups.find((x) => x.groupName === 'Admins')) ctx.session.isAdmin = true;
  console.log(ctx.session.isAdmin);
  groups.forEach((group) => {
    mainScene.hears(group.groupName, async (ctx) => {
      const selectedGroup = await Group.findOne({ groupName: group.groupName });
      const buttons = selectedGroup.dates
        .sort((a, b) => b.date - a.date)
        .map((date) => Markup.callbackButton(date.shownDate, date.shownDate));
      const createNewMeteeng = Markup.callbackButton(
        'Создать новую встречу',
        'createNewMeteeng'
      );
      const backButton = Markup.callbackButton('назад', 'back');
      ctx.session.selectedGroup = selectedGroup;
      ctx.reply(
        'Выберите дату или создайте новую встречу',
        Markup.keyboard([...buttons, createNewMeteeng, backButton])
          .oneTime()
          .extra()
      );
    });
  });
  const buttons = groups.map((group) => {
    const { groupName } = group;
    return Markup.callbackButton(groupName, groupName);
  });
  const adminButton = Markup.callbackButton(
    'Управление группами',
    'control',
    !ctx.session.isAdmin
  );
  ctx.reply(
    'Выберите группу',
    Markup.keyboard([adminButton, ...buttons]).extra()
  );
});
mainScene.hears('назад', (ctx) => {
  ctx.scene.enter('main');
});

mainScene.hears('Управление группами', (ctx) => ctx.scene.enter('admin'));

mainScene.hears(/^\d.+/, (ctx) => {
  const [usersDate, time] = ctx.match[0].split(' ');
  const [day, month, year] = usersDate.split('.');
  const date = new Date(`${month}.${day}.${year} ${time} GMT`);
  ctx.session.date = date;
  ctx.session.shownDate = ctx.match[0];
  ctx.scene.enter('agenda');
});

mainScene.hears('Создать новую встречу', (ctx) => {
  console.log('1');
  ctx.scene.enter('createMeeting');
});

module.exports = mainScene;
