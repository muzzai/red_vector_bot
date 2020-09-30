const mongoose = require('mongoose');

const groupSchema = mongoose.Schema({
  groupName: { type: String, required: true, unique: true },
  members: [String],
  dates: [{ shownDate: String, date: Date }],
});

module.exports = mongoose.model('Group', groupSchema);
