const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: true,
    trim: true
  },

  class: {
    type: String,
    required: true,
    trim: true
  },

  parentName: {
    type: String,
    required: true,
    trim: true
  },

  phone: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    trim: true,
    lowercase: true
  },

  address: {
    type: String,
    trim: true
  },

  document: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Admission', admissionSchema);