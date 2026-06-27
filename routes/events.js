const express = require('express');
const router = express.Router();

const Event = require('../models/Event');
const SchoolInfo = require('../models/SchoolInfo');

// Default Route
router.get('/', (req, res) => {
  res.redirect('/events/fun-fiesta');
});

// Fun & Fiesta
router.get('/fun-fiesta', async (req, res) => {

  try {

    const events = await Event.find({
      category: 'fun-fiesta'
    }).sort({ date: -1 });

    const schoolInfo = await SchoolInfo.findOne();

    res.render('events/fun-fiesta', {
      events,
      schoolInfo,
      title: 'Fun & Fiesta'
    });

  } catch (error) {

    console.log(error);
    res.send('Error loading Fun & Fiesta');

  }

});

// Sports
router.get('/sports', async (req, res) => {

  try {

    const events = await Event.find({
      category: 'sports'
    }).sort({ date: -1 });

    const schoolInfo = await SchoolInfo.findOne();

    res.render('events/sports', {
      events,
      schoolInfo,
      title: 'Sports'
    });

  } catch (error) {

    console.log(error);
    res.send('Error loading Sports');

  }

});

// Republic Day
router.get('/republic-day', async (req, res) => {

  try {

    const events = await Event.find({
      category: 'republic-day'
    }).sort({ date: -1 });

    const schoolInfo = await SchoolInfo.findOne();

    res.render('events/republic-day', {
      events,
      schoolInfo,
      title: 'Republic Day'
    });

  } catch (error) {

    console.log(error);
    res.send('Error loading Republic Day');

  }

});

// Independence Day
router.get('/independence-day', async (req, res) => {

  try {

    const events = await Event.find({
      category: 'independence-day'
    }).sort({ date: -1 });

    const schoolInfo = await SchoolInfo.findOne();

    res.render('events/independence-day', {
      events,
      schoolInfo,
      title: 'Independence Day'
    });

  } catch (error) {

    console.log(error);
    res.send('Error loading Independence Day');

  }

});

module.exports = router;