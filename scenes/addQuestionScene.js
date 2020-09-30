const Question = require('../models/agenda');
const Scene = require('telegraf/scenes/wizard');

const addQuestionScene = new Scene(
  'addQuestion',
  (ctx) => {
    ctx.reply('Введите название вопроса');
    ctx.wizard.state.question = {};
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.wizard.state.question.name = ctx.message.text;
    ctx.reply('Введите описание вопроса');
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.wizard.state.question.description = ctx.message.text;
    ctx.reply('Введите формулировку вопроса');
    return ctx.wizard.next();
  },
  async (ctx) => {
    ctx.wizard.state.question.formulation = ctx.message.text;
    ctx.reply('Спасибо!');
    const { name, formulation, description } = ctx.wizard.state.question;
    try {
      await Question.create({
        name,
        description,
        formulation,
        group: ctx.session.selectedGroup.groupName,
        shownDate: ctx.session.shownDate,
        date: ctx.session.date,
      });
    } catch (err) {
      console.log(err);
    }
    ctx.scene.leave();
    ctx.session.toAddingQuestion = false;
    console.log(ctx.session);
    return ctx.scene.enter('agenda');
  }
);

module.exports = addQuestionScene;
