const express = require('express');
const router = express.Router();
const validator = require('validator');

const Enquiry = require('../models/Enquiry');

function cleanText(value, max = 300) {
  return validator.escape(
    validator.trim(String(value || '').slice(0, max))
  );
}

function cleanPhone(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 10);
}

router.get('/', (req, res) => {
  res.render('pages/enquiry', {
    title: 'Enquiry Form',
    success: req.query.success === 'true',
    error: req.query.error === 'true'
  });
});

router.post('/', async (req, res) => {
  try {
    const name = cleanText(req.body.name, 60);
    const phone = cleanPhone(req.body.phone);
    const email = validator.normalizeEmail(String(req.body.email || '')) || '';
    const message = cleanText(req.body.message, 1000);

    if (!/^[A-Za-z\s.]{3,60}$/.test(name)) {
      return res.redirect('/enquiry?error=true');
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      return res.redirect('/enquiry?error=true');
    }

    if (email && !validator.isEmail(email)) {
      return res.redirect('/enquiry?error=true');
    }

    if (!message || message.length < 5) {
      return res.redirect('/enquiry?error=true');
    }

    await Enquiry.create({
      name,
      phone,
      email,
      message
    });

    res.redirect('/enquiry?success=true');

  } catch (err) {
    console.log('Enquiry Error:', err.message);
    res.redirect('/enquiry?error=true');
  }
});

module.exports = router;