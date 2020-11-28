const Agenda = require('../models/agenda');
const Scene = require('telegraf/scenes/base');
const Markup = require('telegraf/markup');
const { log } = require('telegraf/scenes/base');

const agendaScene = new Scene('agenda');

const navigate = (ctx) =>
  ctx.editMessageText(renderQuestion(ctx), renderButtons(ctx));

agendaScene.enter(async (ctx) => {
  try {
    const agenda = await Agenda.findOne({
      date: { $lte: Date.now() },
    });
    const username = ctx.update.message.from.username;
    ctx.session.index = 0;
    ctx.session.len = agenda.agendaItems.length;
    ctx.session.shownDate = agenda.shownDate;
    ctx.session.username = username;
    ctx.session.agenda = agenda;
    const questions = agenda.agendaItems.reduce(
      (text, x, i) => `${text}${i + 1} вопрос: ${x.name}\n`,
      ''
    );

    ctx.reply(
      questions,
      Markup.inlineKeyboard([
        Markup.callbackButton('Ответить на вопросы', 'answer'),
        Markup.callbackButton('Выйти', 'leave'),
      ]).extra()
    );
  } catch (err) {
    console.log(err);
  }
});
agendaScene.leave((ctx) => ctx.reply('пока'));

agendaScene.action('viewOpinions', (ctx) => {
  const opinions = ctx.session.agenda.agendaItems[
    ctx.session.index
  ].opinions.reduce((text, opinion) => {
    return `${text}${opinion.user} считает, что ${opinion.opinion}\n`;
  }, '');
  ctx.reply(
    opinions,
    Markup.inlineKeyboard([
      Markup.callbackButton('назад к вопросу', 'answer'),
    ]).extra()
  );
});

agendaScene.action('answer', (ctx) => {
  navigate(ctx);
});

agendaScene.action('next', (ctx) => {
  ctx.session.index += 1;
  navigate(ctx);
});

agendaScene.action('prev', (ctx) => {
  ctx.session.index -= 1;
  navigate(ctx);
});

agendaScene.action('back', (ctx) => {
  renderInitialMessage(ctx);
});

agendaScene.on('text', async (ctx) => {
  const usersOpinion = ctx.session.agenda.agendaItems[
    ctx.session.index
  ].opinions.find((opinion) => opinion.user === ctx.message.from.username);
  if (usersOpinion) {
    const index = ctx.session.agenda.agendaItems[
      ctx.session.index
    ].opinions.indexOf(usersOpinion);
    ctx.session.agenda.agendaItems[ctx.session.index].opinions[index] = {
      user: ctx.message.from.username,
      opinion: ctx.message.text,
    };
    ctx.reply('Мнение изменено');
  } else {
    ctx.session.agenda.agendaItems[ctx.session.index].opinions.push({
      user: ctx.message.from.username,
      opinion: ctx.message.text,
    });
    ctx.reply('Мнение принято');
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
  ctx.reply(renderQuestion(ctx), renderButtons(ctx));
  return;
});

const toQuestionsButton = Markup.callbackButton('к вопросам', 'back');
const nextButton = Markup.callbackButton('далее', 'next');
const prevButton = Markup.callbackButton('назад', 'prev');
const leaveOpinionButton = Markup.callbackButton(
  'Мнений по этому вопросу пока нет!',
  'leaveOpinion'
);
const viewOpinionsButton = Markup.callbackButton(
  'просмотреть мнения',
  'viewOpinions'
);

const renderQuestion = ({
  session: {
    index,
    agenda: { agendaItems },
  },
}) => {
  const { name, description, formulation } = agendaItems[index];
  return `${name}\n\n${description}\n\n${formulation}`;
};

const renderNavButtons = (ctx) => {
  const index = ctx.session.index;
  const questionLength = ctx.session.len;
  if (index === 0) return [toQuestionsButton, nextButton];
  if (index - questionLength === -1) return [prevButton, toQuestionsButton];
  return [prevButton, toQuestionsButton, nextButton];
};

const renderOpinionButtons = (ctx) => {
  if (!ctx.session.agenda.agendaItems[ctx.session.index].opinions.length)
    return [leaveOpinionButton];

  return [viewOpinionsButton];
};

const renderButtons = (ctx) => {
  return Markup.inlineKeyboard([
    renderNavButtons(ctx),
    renderOpinionButtons(ctx),
  ]).extra();
};

const renderInitialMessage = (ctx) => {
  const generalDescription = ctx.session.agenda.agendaItems.reduce(
    (text, x) => `${text}${x.name}\n`,
    ''
  );
  ctx.reply(
    generalDescription,
    Markup.inlineKeyboard([
      Markup.callbackButton('Ответить на вопросы', 'answer'),
      Markup.callbackButton('Выйти', 'leave'),
    ]).extra()
  );
};

agendaScene.action('leave', async (ctx) => {
  try {
    await ctx.session.agenda.save();
    ctx.scene.leave();
  } catch (err) {
    console.log(err);
    ctx.reply(err.message);
    ctx.scene.leave();
  }
});

module.exports = agendaScene;
