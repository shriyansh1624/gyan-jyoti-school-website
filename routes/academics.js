const express = require('express');
const router = express.Router();

const AcademicRecord = require('../models/AcademicRecord');
const SchoolInfo = require('../models/SchoolInfo');

async function renderRecordsPage(req, res, filter, pageData) {
  try {
    const schoolInfo = await SchoolInfo.findOne();

    const records = await AcademicRecord.find(filter).sort({
      year: -1,
      priority: 1
    });

    res.render('academics/records', {
      title: pageData.title,
      heading: pageData.heading,
      intro: pageData.intro,
      schoolInfo,
      records
    });

  } catch (error) {
    console.log(error);
    res.send('Error loading academic records');
  }
}

router.get('/', async (req, res) => {
  try {
    const schoolInfo = await SchoolInfo.findOne();

    res.render('academics/academics', {
      title: 'Academics - Gyan Jyoti School',
      active: 'academics',
      schoolInfo
    });

  } catch (error) {
    console.log(error);
    res.send('Error loading academics page');
  }
});
router.get('/10th-toppers', (req, res) => {
  renderRecordsPage(req, res, { className: '10th' }, {
    title: '10th Board Toppers',
    heading: '10th Board Toppers',
    intro: 'Year-wise Class 10 board toppers including state toppers, district toppers and school toppers.'
  });
});

router.get('/12th-toppers', (req, res) => {
  renderRecordsPage(req, res, { className: '12th' }, {
    title: '12th Board Toppers',
    heading: '12th Board Toppers',
    intro: 'Year-wise Class 12 board toppers from different streams with outstanding academic performance.'
  });
});

router.get('/school-toppers', (req, res) => {
  renderRecordsPage(req, res, { rankType: 'School Topper' }, {
    title: 'School Toppers',
    heading: 'School Toppers',
    intro: 'Batch-wise school toppers who achieved excellence in board examinations.'
  });
});

router.get('/sports-records', (req, res) => {
  renderRecordsPage(req, res, { className: 'sports' }, {
    title: 'Sports Academic Records',
    heading: 'Sports Academic Records',
    intro: 'Students who achieved excellence in sports and represented the school at different levels.'
  });
});

module.exports = router;