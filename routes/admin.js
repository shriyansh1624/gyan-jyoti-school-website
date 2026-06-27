const express = require('express');
const router = express.Router();
const validator = require('validator');
const mongoose = require('mongoose');

const Contact = require('../models/Contact');
const Admin = require('../models/Admin');
const Enquiry = require('../models/Enquiry');
const Admission = require('../models/Admission');

const auth = require('../middleware/auth');
function cleanText(value, max = 200) {
  return validator.escape(
    validator.trim(String(value || '').slice(0, max))
  );
}

function cleanPhone(value) {
  return String(value || '')
    .replace(/\D/g, '')
    .slice(0, 10);
}

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}
// LOGIN PAGE
router.get('/login', (req, res) => {
  res.render('admin/login', {
    title: 'Admin Login - Gyan Jyoti School'
  });
});

// LOGIN POST
router.post('/login', async (req, res) => {
  try {

    const email = validator.normalizeEmail(req.body.email || '');

    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).render('admin/login', {
        error: 'Email and password required',
        title: 'Admin Login'
      });
    }

    const admin = await Admin.findOne({
      email
    });

    if (!admin || password !== admin.password) {
      return res.status(401).render('admin/login', {
        error: 'Invalid credentials',
        title: 'Admin Login'
      });
    }

    req.session.admin = {
      id: admin._id,
      name: admin.name,
      email: admin.email
    };

    res.redirect('/admin/dashboard');

  } catch (err) {
    console.log(err);

    res.status(500).render('admin/login', {
      error: 'Server Error',
      title: 'Admin Login'
    });
  }
});

// DASHBOARD + SEARCH
router.get('/dashboard', auth, async (req, res) => {
  try {
    const keyword = req.query.keyword || '';

    const contactQuery = keyword
      ? {
          $or: [
            { name: { $regex: keyword, $options: 'i' } },
            { email: { $regex: keyword, $options: 'i' } },
            { phone: { $regex: keyword, $options: 'i' } },
            { subject: { $regex: keyword, $options: 'i' } }
          ]
        }
      : {};

    const enquiryQuery = keyword
      ? {
          $or: [
            { name: { $regex: keyword, $options: 'i' } },
            { email: { $regex: keyword, $options: 'i' } },
            { phone: { $regex: keyword, $options: 'i' } },
            { message: { $regex: keyword, $options: 'i' } }
          ]
        }
      : {};

    const admissionQuery = keyword
      ? {
          $or: [
            { studentName: { $regex: keyword, $options: 'i' } },
            { parentName: { $regex: keyword, $options: 'i' } },
            { phone: { $regex: keyword, $options: 'i' } },
            { email: { $regex: keyword, $options: 'i' } },
            { class: { $regex: keyword, $options: 'i' } }
          ]
        }
      : {};

    const contacts = await Contact.find(contactQuery).sort({ createdAt: -1 }).lean();
    const enquiries = await Enquiry.find(enquiryQuery).sort({ createdAt: -1 }).lean();
    const admissions = await Admission.find(admissionQuery).sort({ createdAt: -1 }).lean();

    const allContacts = await Contact.find().lean();
    const allEnquiries = await Enquiry.find().lean();
    const allAdmissions = await Admission.find().lean();

    const totalCount = allContacts.length + allEnquiries.length + allAdmissions.length;
    const notificationCount = contacts.length + enquiries.length + admissions.length;

    const monthMap = {};

    function monthKey(date) {
      const d = new Date(date);
      return d.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
    }

    allAdmissions.forEach(a => {
      const key = monthKey(a.createdAt);
      if (!monthMap[key]) monthMap[key] = { admissions: 0, enquiries: 0 };
      monthMap[key].admissions++;
    });

    allEnquiries.forEach(e => {
      const key = monthKey(e.createdAt);
      if (!monthMap[key]) monthMap[key] = { admissions: 0, enquiries: 0 };
      monthMap[key].enquiries++;
    });

    const monthlyLabels = Object.keys(monthMap).slice(-6);
    const monthlyAdmissions = monthlyLabels.map(m => monthMap[m].admissions);
    const monthlyEnquiries = monthlyLabels.map(m => monthMap[m].enquiries);

    res.render('admin/dashboard', {
      contacts,
      enquiries,
      admissions,
      keyword,

      totalCount,
      contactCount: allContacts.length,
      enquiryCount: allEnquiries.length,
      admissionCount: allAdmissions.length,
      notificationCount,

      monthlyLabels,
      monthlyAdmissions,
      monthlyEnquiries,

      adminName: req.session.admin.name,
      title: 'Admin Dashboard - Gyan Jyoti School'
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.send('Dashboard loading error');
  }
});

// EDIT ADMISSION PAGE
router.post('/admission/edit/:id', auth, async (req, res) => {

  if (!isValidId(req.params.id))
    return res.redirect('/admin/dashboard');

  const studentName = cleanText(req.body.studentName, 60);
  const className = cleanText(req.body.class, 20);
  const parentName = cleanText(req.body.parentName, 60);
  const phone = cleanPhone(req.body.phone);
  const email = validator.normalizeEmail(req.body.email || '');
  const address = cleanText(req.body.address, 300);

  if (!/^[A-Za-z\s.]{3,60}$/.test(studentName))
    return res.redirect('/admin/dashboard');

  if (!/^[A-Za-z\s.]{3,60}$/.test(parentName))
    return res.redirect('/admin/dashboard');

  if (!/^[0-9]{10}$/.test(phone))
    return res.redirect('/admin/dashboard');

  await Admission.findByIdAndUpdate(
    req.params.id,
    {
      studentName,
      class: className,
      parentName,
      phone,
      email,
      address
    }
  );

  res.redirect('/admin/dashboard#admissions');
});

// UPDATE ADMISSION
router.post('/admission/edit/:id', auth, async (req, res) => {
  await Admission.findByIdAndUpdate(req.params.id, {
    studentName: req.body.studentName,
    class: req.body.class,
    parentName: req.body.parentName,
    phone: req.body.phone,
    email: req.body.email,
    address: req.body.address
  });

  res.redirect('/admin/dashboard#admissions');
});

// DELETE ADMISSION
router.get('/admission/delete/:id', auth, async (req, res) => {

  if (!isValidId(req.params.id))
    return res.redirect('/admin/dashboard');

  await Admission.findByIdAndDelete(req.params.id);

  res.redirect('/admin/dashboard#admissions');
});

// EDIT ENQUIRY PAGE
router.post('/enquiry/edit/:id', auth, async (req, res) => {

  if (!isValidId(req.params.id))
    return res.redirect('/admin/dashboard');

  const name = cleanText(req.body.name, 60);
  const phone = cleanPhone(req.body.phone);
  const email = validator.normalizeEmail(req.body.email || '');
  const message = cleanText(req.body.message, 500);

  if (!/^[A-Za-z\s.]{3,60}$/.test(name))
    return res.redirect('/admin/dashboard');

  if (!/^[0-9]{10}$/.test(phone))
    return res.redirect('/admin/dashboard');

  await Enquiry.findByIdAndUpdate(
    req.params.id,
    {
      name,
      phone,
      email,
      message
    }
  );

  res.redirect('/admin/dashboard#enquiries');
});
// UPDATE ENQUIRY
router.post('/enquiry/edit/:id', auth, async (req, res) => {
  await Enquiry.findByIdAndUpdate(req.params.id, {
    name: req.body.name,
    phone: req.body.phone,
    email: req.body.email,
    message: req.body.message
  });

  res.redirect('/admin/dashboard#enquiries');
});

// DELETE ENQUIRY
router.get('/enquiry/delete/:id', auth, async (req, res) => {

  if (!isValidId(req.params.id))
    return res.redirect('/admin/dashboard');

  await Enquiry.findByIdAndDelete(req.params.id);

  res.redirect('/admin/dashboard#enquiries');
});

// DELETE CONTACT
router.get('/contact/delete/:id', auth, async (req, res) => {

  if (!isValidId(req.params.id))
    return res.redirect('/admin/dashboard');

  await Contact.findByIdAndDelete(req.params.id);

  res.redirect('/admin/dashboard#contacts');
});

// LOGOUT
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;