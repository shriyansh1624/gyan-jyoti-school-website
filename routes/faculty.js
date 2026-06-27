const express = require('express');
const router = express.Router();

const Faculty = require('../models/Faculty');
const SchoolInfo = require('../models/SchoolInfo');

router.get('/', async (req, res) => {
  try {
    const schoolInfo = await SchoolInfo.findOne();

    const topFaculties = await Faculty.find({
      category: 'top-faculty'
    }).sort({ priority: 1 }).limit(5);

    const incharges = await Faculty.find({
      category: 'incharge'
    }).sort({ priority: 1 });

    const libraryComputing = await Faculty.find({
      category: 'library-computing'
    }).sort({ priority: 1 });

    res.render('faculty/faculty', {
      title: 'Faculty',
      schoolInfo,
      topFaculties,
      incharges,
      libraryComputing
    });

  } catch (error) {
    console.log(error);
    res.send('Error loading faculty page');
  }
});

module.exports = router;