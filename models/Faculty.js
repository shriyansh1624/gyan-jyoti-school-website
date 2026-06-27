const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  role: {
    type: String,
    required: true
  },

  category: {
    type: String,
    required: true,
    enum: ['top-faculty', 'incharge', 'library-computing']
  },

  specialization: {
    type: String
  },

  department: {
    type: String
  },

  image: {
    type: String
  },

  priority: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Faculty', facultySchema);