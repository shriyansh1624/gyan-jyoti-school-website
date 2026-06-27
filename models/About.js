const mongoose = require('mongoose');

const aboutSchema = new mongoose.Schema({
  section: {
    type: String,
    enum: ['about', 'vision', 'mission', 'founder', 'principal', 'advantages'],
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: null
  },
  author: {
    type: String,
    default: ''
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('About', aboutSchema);