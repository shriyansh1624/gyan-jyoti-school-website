const express = require('express');
const router = express.Router();
const Slider = require('../models/Slider');
const About = require('../models/About');
const SchoolInfo = require('../models/SchoolInfo');

// Home Page
router.get('/', async (req, res) => {
  try {
    const sliders = await Slider.find({ active: true }).sort({ position: 1 });
    const schoolInfo = await SchoolInfo.findOne();

    res.render('index', {
      sliders,
      schoolInfo,
      title: 'Home - Gyan Jyoti School',
      active: 'home'
    });
  } catch (error) {
    console.error('Error loading home:', error);
    res.render('index', {
      sliders: [],
      schoolInfo: null,
      title: 'Home - Gyan Jyoti School',
      active: 'home'
    });
  }
});
router.get('/about', async (req, res) => {
  try {
    const about = await About.findOne({ section: 'about' });

    res.render('about/about', {
      title: 'About Us - Gyan Jyoti School',
      active: 'about',
      about
    });

  } catch (err) {
    console.log(err);
    res.redirect('/');
  }
});

// Vision & Mission
router.get('/about/vision', async (req, res) => {
  try {
    const data = await About.findOne({ section: 'vision' });
    const schoolInfo = await SchoolInfo.findOne();

    res.render('about/vision', {
      data,
      schoolInfo,
      title: 'Vision & Mission - Gyan Jyoti School',
      active: 'about'
    });
  } catch (error) {
    res.status(500).send('Error loading page');
  }
});

// Founder's Message
router.get('/about/founder', async (req, res) => {
  try {
    const about = await About.findOne({ section: 'founder' });
    const schoolInfo = await SchoolInfo.findOne();

    res.render('about/founder', {
      title: "Founder's Message",
      active: 'about',
      about,
      schoolInfo
    });
  } catch (err) {
    console.log(err);
    res.redirect('/');
  }
});

// Principal's Message
router.get('/about/principal', async (req, res) => {
  try {
    const data = await About.findOne({ section: 'principal' });
    const schoolInfo = await SchoolInfo.findOne();

    res.render('about/principal', {
      data,
      schoolInfo,
      title: "Principal's Message - Gyan Jyoti School",
      active: 'about'
    });
  } catch (error) {
    res.status(500).send('Error loading page');
  }
});

router.get('/fees', async (req, res) => {
  res.render('fees', {
    title: 'Fees Structure - Gyan Jyoti School',
    active: 'fees'
  });
});
// Mission
router.get('/about/mission', async (req, res) => {
  try {
    const data = await About.findOne({ section: 'mission' });
    const schoolInfo = await SchoolInfo.findOne();

    res.render('about/mission', {
      data,
      schoolInfo,
      title: 'Our Mission - Gyan Jyoti School',
      active: 'about'
    });
  } catch (error) {
    res.status(500).send('Error loading page');
  }
});

router.get('/about/accolades', async (req, res) => {
  res.render('about/accolades', {
    title: 'Developer & Management - Gyan Jyoti School',
    active: 'about'
  });
});

// Advantages (FIXED)
router.get('/about/advantages', async (req, res) => {
  try {
    const data = await About.findOne({ section: 'advantages' });
    const schoolInfo = await SchoolInfo.findOne();

    res.render('about/advantages', {
      data,
      schoolInfo,
      title: 'MIS Advantages - Gyan Jyoti School',
      active: 'about'
    });
  } catch (error) {
    res.status(500).send('Error loading page');
  }
});

module.exports = router;