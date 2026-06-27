const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({

  title: {
    type: String,
    required: true,
    trim: true
  },

  category: {
    type: String,
    required: true,
    enum: [
      'fun-fiesta',
      'sports',
      'republic-day',
      'independence-day'
    ]
  },

  description: {
    type: String,
    required: true
  },

  date: {
    type: Date,
    required: true
  },

  image: {
    type: String
  }

}, {
  timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);