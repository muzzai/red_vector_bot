const mongoose = require('mongoose');

const test = new mongoose.Schema({
  field1: String,
  field2: Number,
});

module.exports = mongoose.model('Test', test);
