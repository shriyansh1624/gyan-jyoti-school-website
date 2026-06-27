const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const validator = require('validator');

const Admission = require('../models/Admission');
const Enquiry = require('../models/Enquiry');
const SchoolInfo = require('../models/SchoolInfo');

const uploadDir = path.join(__dirname, '..', 'public', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

function cleanText(value, max = 300) {
  return validator.escape(
    validator.trim(String(value || '').slice(0, max))
  );
}

function cleanPhone(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 10);
}

const allowedExt = ['.pdf', '.jpg', '.jpeg', '.png'];
const allowedMime = ['application/pdf', 'image/jpeg', 'image/png'];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },

  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .slice(0, 40);

    cb(null, Date.now() + '-' + baseName + ext);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024
  },
  fileFilter: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowedExt.includes(ext) || !allowedMime.includes(file.mimetype)) {
      return cb(new Error('Only PDF, JPG, JPEG and PNG files are allowed'));
    }

    cb(null, true);
  }
});

router.get('/', (req, res) => {
  res.redirect('/admission/process');
});

router.get('/process', async (req, res) => {
  const schoolInfo = await SchoolInfo.findOne();

  res.render('admission/process', {
    title: 'Admission Process',
    schoolInfo
  });
});

router.get('/enquiry', async (req, res) => {
  const schoolInfo = await SchoolInfo.findOne();

  res.render('admission/enquiry', {
    title: 'Enquiry Form',
    schoolInfo,
    query: req.query
  });
});

router.post('/enquiry', async (req, res) => {
  try {
    const name = cleanText(req.body.name, 60);
    const phone = cleanPhone(req.body.phone);
    const email = validator.normalizeEmail(String(req.body.email || '')) || '';
    const message = cleanText(req.body.message, 1000);

    if (!/^[A-Za-z\s.]{3,60}$/.test(name)) {
      return res.redirect('/admission/enquiry?error=true');
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      return res.redirect('/admission/enquiry?error=true');
    }

    if (email && !validator.isEmail(email)) {
      return res.redirect('/admission/enquiry?error=true');
    }

    if (!message || message.length < 5) {
      return res.redirect('/admission/enquiry?error=true');
    }

    await Enquiry.create({
      name,
      phone,
      email,
      message
    });

    res.redirect('/admission/enquiry?success=true');

  } catch (err) {
    console.log('Admission Enquiry Error:', err.message);
    res.redirect('/admission/enquiry?error=true');
  }
});

router.get('/registration', async (req, res) => {
  const schoolInfo = await SchoolInfo.findOne();

  res.render('admission/registration', {
    title: 'Registration Form',
    schoolInfo,
    query: req.query
  });
});

router.post('/registration', (req, res) => {
  upload.single('document')(req, res, async function (uploadErr) {
    if (uploadErr) {
      console.log('Upload Error:', uploadErr.message);
      return res.redirect('/admission/registration?error=true');
    }

    try {
      const studentName = cleanText(req.body.studentName, 70);
      const className = cleanText(req.body.class, 30);
      const parentName = cleanText(req.body.parentName, 70);
      const phone = cleanPhone(req.body.phone);
      const email = validator.normalizeEmail(String(req.body.email || '')) || '';
      const address = cleanText(req.body.address, 500);

      if (!/^[A-Za-z\s.]{3,70}$/.test(studentName)) {
        return res.redirect('/admission/registration?error=true');
      }

      if (!className || className.length > 30) {
        return res.redirect('/admission/registration?error=true');
      }

      if (!/^[A-Za-z\s.]{3,70}$/.test(parentName)) {
        return res.redirect('/admission/registration?error=true');
      }

      if (!/^[0-9]{10}$/.test(phone)) {
        return res.redirect('/admission/registration?error=true');
      }

      if (email && !validator.isEmail(email)) {
        return res.redirect('/admission/registration?error=true');
      }

      if (!address || address.length < 5) {
        return res.redirect('/admission/registration?error=true');
      }

      await Admission.create({
        studentName,
        class: className,
        parentName,
        phone,
        email,
        address,
        document: req.file ? req.file.filename : null
      });

      res.redirect('/admission/registration?success=true');

    } catch (err) {
      console.log('Admission Error:', err.message);
      res.redirect('/admission/registration?error=true');
    }
  });
});

router.get('/guidelines', async (req, res) => {
  const schoolInfo = await SchoolInfo.findOne();

  res.render('admission/guidelines', {
    title: 'Guidelines & Policies',
    schoolInfo
  });
});

router.get('/map', async (req, res) => {
  const schoolInfo = await SchoolInfo.findOne();

  res.render('admission/map', {
    title: 'School Map',
    schoolInfo
  });
});

module.exports = router;