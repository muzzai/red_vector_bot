const Question = require('../models/agenda');
const Scene = require('telegraf/scenes/base');
const Markup = require('telegraf/markup');
const agendaScene = new Scene('agenda');

const navigate = (ctx) =>
  ctx.editMessageText(renderQuestion(ctx), renderButtons(ctx));

agendaScene.enter(async (ctx) => {
  try {
    ctx.session.index = 0;
    ctx.session.username = ctx.update.message.from.username;
    await renderInitialMessage(ctx);
  } catch (err) {
    ctx.reply(err.message);
  }
});
agendaScene.leave((ctx) => {
  ctx.reply(`Добавление вопроса к встрече ${ctx.session.date}`);
});

const renderInitialMessage = async (ctx) => {
  const agenda = await Question.find({
    date: ctx.session.date,
    group: ctx.session.selectedGroup.groupName,
  });

  console.log({ agenda });

  if (!agenda.length) {
    return ctx.reply(
      'Вопросов пока нет',
      Markup.inlineKeyboard([
        [Markup.callbackButton('Добавить вопрос', 'addQuestion')],
        [Markup.callbackButton('Выйти', 'leave')],
      ]).extra()
    );
  }

  ctx.session.len = agenda.length;
  ctx.session.agenda = agenda;
  const getTotalRating = ({ votes }) => {
    if (votes.length) {
      return votes.reduce((sum, x) => sum + x.rating, 0) / votes.length;
    }
    return 0;
  };

  const questionsText = agenda
    .sort((a, b) => getTotalRating(b) - getTotalRating(a))
    .reduce((text, x) => `${text}${getTotalRating(x)} баллов: ${x.name}\n`, '');

  ctx.reply(
    questionsText,
    Markup.inlineKeyboard([
      [Markup.callbackButton('Ответить на вопросы', 'answer')],
      [Markup.callbackButton('Добавить вопрос', 'addQuestion')],
      [Markup.callbackButton('Выйти', 'leave')],
    ]).extra()
  );
};

agendaScene.action('addQuestion', (ctx) => {
  ctx.session.toAddingQuestion = true;
  ctx.scene.enter('addQuestion');
});

agendaScene.action('viewOpinions', (ctx) => {
  const opinions = ctx.session.agenda[ctx.session.index].opinions.reduce(
    (text, opinion) => {
      return `${text}${opinion.user} считает, что \n> ${opinion.opinion}\n`;
    },
    ''
  );
  ctx.editMessageText(
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

agendaScene.action('back', async (ctx) => {
  await renderInitialMessage(ctx);
});

agendaScene.action('rate', (ctx) => {
  ctx.editMessageText(
    renderQuestion(ctx),
    Markup.inlineKeyboard([
      ratingButtons.slice(0, 5),
      ratingButtons.slice(5),
    ]).extra()
  );
});

const ratingButtons = (() => {
  return Array(10)
    .fill()
    .map((x, ith) => {
      const i = ith + 1;
      agendaScene.action(`${i}`, async (ctx) => {
        const question = ctx.session.agenda[ctx.session.index];
        const index = question.votes.findIndex(
          (x) => x.user === ctx.session.username
        );
        if (index === -1) {
          question.votes.push({ user: ctx.session.username, rating: i });
        } else {
          question.votes[index].rating = i;
        }
        await question.save();
        navigate(ctx);
      });
      return Markup.callbackButton(`${i}`, `${i}`);
    });
})().reverse();

agendaScene.on('text', async (ctx) => {
  const {
    session: { agenda, index, username },
  } = ctx;
  if (!agenda) {
    return;
  }
  const question = agenda[index];
  const usersOpinion = agenda[index].opinions.find(
    (opinion) => opinion.user === username
  );
  if (usersOpinion) {
    const opinionIndex = agenda[index].opinions.indexOf(usersOpinion);
    question[opinionIndex] = {
      user: username,
      opinion: ctx.message.text,
    };
    ctx.reply('Мнение изменено');
  } else {
    question.opinions.push({
      user: username,
      opinion: ctx.message.text,
    });
    ctx.reply('Мнение принято');
  }
  try {
    await question.save();
    ctx.reply(renderQuestion(ctx), renderButtons(ctx));
    return;
  } catch (err) {
    ctx.reply(err.message);
  }
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

const renderQuestion = ({ session: { index, agenda } }) => {
  const { name, description, formulation } = agenda[index];
  return `${name}\n\n${description}\n\n${formulation}`;
};

const renderNavButtons = ({ session: { index, len } }) => {
  if (index === 0 && index - len === -1) return [toQuestionsButton];
  if (index === 0) return [toQuestionsButton, nextButton];
  if (index - len === -1) return [prevButton, toQuestionsButton];
  return [prevButton, toQuestionsButton, nextButton];
};

const renderRateButton = ({ session: { agenda, index, username } }) => {
  const rated = agenda[index].votes.find((x) => x.user === username);
  return Markup.callbackButton(rated ? 'Изменить оценку' : 'Оценить', 'rate');
};

const renderOpinionButtons = (ctx) => {
  if (!ctx.session.agenda[ctx.session.index].opinions.length)
    return [leaveOpinionButton];

  return [viewOpinionsButton];
};

const renderButtons = (ctx) => {
  return Markup.inlineKeyboard([
    renderNavButtons(ctx),
    [...renderOpinionButtons(ctx), renderRateButton(ctx)],
  ]).extra();
};

agendaScene.action('leave', async (ctx) => {
  ctx.scene.enter('main');
  ctx.scene.leave();
});

module.exports = agendaScene;
