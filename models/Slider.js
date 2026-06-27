const mongoose = require('mongoose');

const sliderSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    required: true
  },
  buttonText: {
    type: String,
    default: 'ENROLL NOW'
  },
  buttonLink: {
    type: String,
    default: '/admission'
  },
  position: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Slider', sliderSchema);