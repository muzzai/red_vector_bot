const { Schema } = require('mongoose');

const opinionsSchema = new Schema({
  date: Date,
  topics: [String],
});

module.exports = opinionsSchema;
