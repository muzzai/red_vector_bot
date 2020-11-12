const mongoose = require('mongoose');

const agendaSchema = new mongoose.Schema({
  shownDate: { type: String, unique: true, required: true },
  date: Date,
  group: String,
  agendaItems: [
    {
      rating: Number,
      name: String,
      description: String,
      actualTo: Date,
      opinions: [{ opinion: String, user: String }],
      total: String,
      formulation: String,
    },
  ],
});

module.exports = mongoose.model('Agenda', agendaSchema);
