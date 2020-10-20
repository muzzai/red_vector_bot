const { Schema } = require('mongoose');

const agendaSchema = new Schema({
  date: Date,
  questions: [String],
});

module.exports = agendaSchema;
