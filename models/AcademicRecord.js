const mongoose = require('mongoose');

const academicRecordSchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: true
  },

  className: {
    type: String,
    required: true,
    enum: ['10th', '12th', 'sports']
  },

  year: {
    type: String,
    required: true
  },

  batch: {
    type: String,
    required: true
  },

  rankType: {
    type: String,
    required: true,
    enum: ['State Topper', 'District Topper', 'School Topper', 'Sports Achievement']
  },

  percentage: {
    type: String
  },

  stream: {
    type: String
  },

  achievement: {
    type: String
  },

  photo: {
    type: String
  },

  priority: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AcademicRecord', academicRecordSchema);