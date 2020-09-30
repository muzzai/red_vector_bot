const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  shownDate: { type: String, required: true },
  date: Date,
  group: String,
  rating: Number,
  votes: [{ user: String, rating: Number }],
  name: String,
  description: String,
  actualTo: Date,
  opinions: [{ opinion: String, user: String }],
  total: String,
  formulation: String,
});

module.exports = mongoose.model('Question', questionSchema);
