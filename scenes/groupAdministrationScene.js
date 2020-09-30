const Scene = require('telegraf/scenes/base');
const Markup = require('telegraf/markup');
const group = require('../models/group');

const groupAdministrationScene = new Scene('admin');

const adminButtons = [
  [Markup.callbackButton('Добавить участников', 'addMember')],
  [Markup.callbackButton('Удалить участников', 'deleteMember')],
  [Markup.callbackButton('Удалить группу', 'deleteGroup')],
  [
    Markup.callbackButton('назад', 'back'),
    Markup.callbackButton('выйти', 'leave'),
  ],
];

groupAdministrationScene.enter(async (ctx) => {
  const groups = await group.find();
  const buttons = groups.map((group) => {
    groupAdministrationScene.action(group.groupName, (ctx) => {
      ctx.session.editingGroup = group;
      ctx.reply(
        ctx.reply(group.groupName, Markup.inlineKeyboard(adminButtons).extra())
      );
    });
    return [Markup.callbackButton(group.groupName, group.groupName)];
  });
  ctx.reply(
    'Выберите группу для управления',
    Markup.inlineKeyboard([
      [Markup.callbackButton('Создать группу', 'create')],
      ...buttons,
      [Markup.callbackButton('выйти', 'leave')],
    ]).extra()
  );
});

groupAdministrationScene.action('addMember', (ctx) => {
  ctx.session.add = true;
  ctx.reply('введите юзернейм пользователя');
});

groupAdministrationScene.hears(/.+/, async (ctx) => {
  if (!ctx.session.add && !ctx.session.addGroup) {
    return ctx.reply('нажмите "добавить участника" или "добавить группу"');
  }
  if (ctx.session.add) {
    ctx.session.editingGroup.members.push(ctx.match[0]);

    await ctx.session.editingGroup.save();
    ctx.session.add = false;
  }
  if (ctx.session.addGroup) {
    ctx.session.addGroup = false;
    ctx.session.editingGroup = await group.create({
      groupName: ctx.match[0],
      members: [ctx.session.username],
    });
  }
  ctx.reply('добавлено', Markup.inlineKeyboard(adminButtons).extra());
});

groupAdministrationScene.action('deleteMember', async (ctx) => {
  const buttons = ctx.session.editingGroup.members.map((member) => {
    groupAdministrationScene.action(member, async (ctx) => {
      await group.updateOne(
        { id: ctx.session.editingGroup.id },
        { $pull: { members: member } }
      );
      return ctx.reply(
        'пользователь удалён',
        Markup.inlineKeyboard(adminButtons).extra()
      );
    });
    return Markup.callbackButton(member, member);
  });
  if (!buttons.length) {
    return ctx.reply('в группе никого нет');
  }
  ctx.reply(
    'нажмите на имя пользователя, чтобы удалить',
    Markup.inlineKeyboard(buttons).extra()
  );
});

groupAdministrationScene.action('leave', (ctx) => {
  ctx.scene.enter('main');
});

groupAdministrationScene.action('deleteGroup', async (ctx) => {
  await ctx.session.editingGroup.delete();
  ctx.reply('группа удална');
  ctx.scene.enter('admin');
});

groupAdministrationScene.action('back', (ctx) => {
  ctx.scene.enter('admin');
});

groupAdministrationScene.action('create', (ctx) => {
  ctx.session.addGroup = true;
  ctx.reply('введите название группы');
});

module.exports = groupAdministrationScene;
