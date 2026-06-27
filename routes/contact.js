const express = require('express');
const router = express.Router();
const validator = require('validator');

const Contact = require('../models/Contact');
const SchoolInfo = require('../models/SchoolInfo');

function cleanText(value, max = 300) {
  return validator.escape(
    validator.trim(String(value || '').slice(0, max))
  );
}

function cleanPhone(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 10);
}

router.get('/', async (req, res) => {
  const schoolInfo = await SchoolInfo.findOne();

  res.render('contact/form', {
    title: 'Contact Us',
    schoolInfo,
    success: req.query.success === 'true',
    error: req.query.error === 'true'
  });
});

router.post('/', async (req, res) => {
  try {
    const name = cleanText(req.body.name, 60);
    const email = validator.normalizeEmail(String(req.body.email || '')) || '';
    const phone = cleanPhone(req.body.phone);
    const category = cleanText(req.body.category, 60);
    const subject = cleanText(req.body.subject, 120);
    const message = cleanText(req.body.message, 1000);

    if (!/^[A-Za-z\s.]{3,60}$/.test(name)) {
      return res.redirect('/contact?error=true');
    }

    if (!validator.isEmail(email)) {
      return res.redirect('/contact?error=true');
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      return res.redirect('/contact?error=true');
    }

    if (!category || !subject || message.length < 5) {
      return res.redirect('/contact?error=true');
    }

    await Contact.create({
      name,
      email,
      phone,
      category,
      subject,
      message,
      status: 'new'
    });

    res.redirect('/contact?success=true');

  } catch (err) {
    console.log('Contact Error:', err.message);
    res.redirect('/contact?error=true');
  }
});

module.exports = router;