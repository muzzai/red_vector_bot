const Scene = require('telegraf/scenes/wizard');

const createMeetingScene = new Scene(
  'createMeeting',
  (ctx) => {
    ctx.reply('Введите дату и время встречи в формате ДД.ММ.ГГГГ ЧЧ:ММ');
    return ctx.wizard.next();
  },
  (ctx) => {
    const [usersDate, time] = ctx.message.text.split(' ');
    const [day, month, year] = usersDate.split('.');
    const date = new Date(`${month}.${day}.${year} ${time} GMT`);
    console.log(date);
    if (date.toString() === 'Invalid Date') {
      return ctx.reply(
        'Неферный формат, попробуйте снова в формате ДД.ММ.ГГГГ ЧЧ:ММ'
      );
    }
    ctx.session.selectedGroup.dates.push({ shownDate: ctx.message.text, date });
    ctx.session.selectedGroup.save();
    ctx.scene.enter('main');
  }
);

module.exports = createMeetingScene;
