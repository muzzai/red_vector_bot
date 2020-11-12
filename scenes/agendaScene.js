const Agenda = require('../models/agenda');
const Markup = require('telegraf/markup');

const collector = {};

const getAgendaForDate = async (date) => {
  try {
    const agendaForDate = await Agenda.findOne({ meetingDate: date });
    return agendaForDate.agendaItems.map(({ topic }) => {
      return [
        Markup.callbackButton(topic, topic),
        Markup.callbackButton('+', topic + '+'),
        Markup.callbackButton('-', topic + '-'),
      ];
    });
  } catch (err) {
    console.log(err);
  }
};

module.exports = getAgendaForDate;
