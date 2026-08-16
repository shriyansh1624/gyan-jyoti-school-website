const mongoose = require('mongoose');

const principalContactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 120
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10
    },

    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },

    status: {
      type: String,
      enum: ['new', 'read', 'resolved'],
      default: 'new'
    },

    notificationStatus: {
      type: String,
      enum: [
        'pending',
        'sent',
        'failed',
        'not_configured'
      ],
      default: 'pending'
    },

    notificationSentAt: {
      type: Date,
      default: null
    },

    createdAt: {
      type: Date,
      default: Date.now
    },

    updatedAt: {
      type: Date,
      default: Date.now
    }
  }
);

module.exports = mongoose.model(
  'PrincipalContact',
  principalContactSchema
);