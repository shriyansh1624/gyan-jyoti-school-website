const mongoose = require('mongoose');

const schoolInfoSchema = new mongoose.Schema({
  schoolName: {
    type: String,
    default: 'Gyan Jyoti School'
  },
  tagline: {
    type: String,
    default: 'International School'
  },
  affiliation: {
    type: String,
    default: 'CBSE Affiliation No. 1030842'
  },
  email: {
    type: String,
    default: 'info@gyanjyoti.com'
  },
  phone: {
    type: String,
    default: '+91 98765-43210'
  },
  address: {
    type: String,
    default: 'School Address, City, State 123456'
  },
  logo: {
    type: String,
    default: '/images/logo.png'
  },
  favicon: {
    type: String,
    default: '/images/favicon.ico'
  },
  socialLinks: {
    facebook: {
      type: String,
      default: 'https://facebook.com/gyanjyoti'
    },
    instagram: {
      type: String,
      default: 'https://instagram.com/gyanjyoti'
    },
    whatsapp: {
      type: String,
      default: 'https://wa.me/919876543210'
    },
    youtube: {
      type: String,
      default: 'https://youtube.com/gyanjyoti'
    }
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SchoolInfo', schoolInfoSchema);