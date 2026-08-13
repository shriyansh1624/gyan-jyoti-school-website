const express = require('express');
const router = express.Router();

const AcademicRecord = require('../models/AcademicRecord');
const SchoolInfo = require('../models/SchoolInfo');


// =========================================================
// HELPER
// =========================================================

async function getSchoolInfo() {

    return await SchoolInfo.findOne();

}


// =========================================================
// MAIN ACADEMICS / TOP ACHIEVERS PAGE
// =========================================================
// Shows all academic toppers on ONE page:
//
// 10th
// 12th
// State Topper
// District Topper
// School Topper
//
// Sports records are excluded here.
// =========================================================

router.get('/', async (req, res) => {

    try {

        const schoolInfo =
            await getSchoolInfo();


        const records =
            await AcademicRecord.find({

                className: {
                    $in: ['10th', '12th']
                },

                rankType: {
                    $in: [
                        'State Topper',
                        'District Topper',
                        'School Topper'
                    ]
                }

            })
            .sort({
                year: -1,
                priority: 1,
                createdAt: -1
            })
            .lean();


        res.render(
            'academics/academics',
            {

                title:
                    'Top Achievers - Gyan Jyoti School',

                active:
                    'academics',

                schoolInfo,

                records

            }
        );


    } catch (error) {

        console.error(
            '❌ Error loading Top Achievers:',
            error
        );


        res.status(500).send(
            'Error loading academic achievements'
        );

    }

});


// =========================================================
// OPTIONAL RECORDS HELPER
// =========================================================
// Used by the individual record pages if you still want
// to keep them temporarily.
//
// These routes can be removed later after the new
// single-page system is fully tested.
// =========================================================

async function renderRecordsPage(
    req,
    res,
    filter,
    pageData
) {

    try {

        const schoolInfo =
            await getSchoolInfo();


        const records =
            await AcademicRecord.find(filter)
            .sort({
                year: -1,
                priority: 1,
                createdAt: -1
            })
            .lean();


        res.render(
            'academics/records',
            {

                title:
                    pageData.title,

                heading:
                    pageData.heading,

                intro:
                    pageData.intro,

                schoolInfo,

                records

            }
        );


    } catch (error) {

        console.error(
            '❌ Error loading academic records:',
            error
        );


        res.status(500).send(
            'Error loading academic records'
        );

    }

}


// =========================================================
// OLD 10TH TOPPERS ROUTE
// =========================================================

router.get(
    '/10th-toppers',
    async (req, res) => {

        await renderRecordsPage(
            req,
            res,
            {
                className: '10th',

                rankType: {
                    $in: [
                        'State Topper',
                        'District Topper',
                        'School Topper'
                    ]
                }
            },
            {

                title:
                    '10th Board Toppers',

                heading:
                    '10th Board Toppers',

                intro:
                    'Year-wise Class 10 board toppers including state, district and school toppers.'

            }
        );

    }
);


// =========================================================
// OLD 12TH TOPPERS ROUTE
// =========================================================

router.get(
    '/12th-toppers',
    async (req, res) => {

        await renderRecordsPage(
            req,
            res,
            {
                className: '12th',

                rankType: {
                    $in: [
                        'State Topper',
                        'District Topper',
                        'School Topper'
                    ]
                }
            },
            {

                title:
                    '12th Board Toppers',

                heading:
                    '12th Board Toppers',

                intro:
                    'Year-wise Class 12 board toppers from different streams with outstanding academic performance.'

            }
        );

    }
);


// =========================================================
// OLD SCHOOL TOPPERS ROUTE
// =========================================================

router.get(
    '/school-toppers',
    async (req, res) => {

        await renderRecordsPage(
            req,
            res,
            {
                className: {
                    $in: ['10th', '12th']
                },

                rankType:
                    'School Topper'
            },
            {

                title:
                    'School Toppers',

                heading:
                    'School Toppers',

                intro:
                    'Batch-wise school toppers who achieved excellence in board examinations.'

            }
        );

    }
);


// =========================================================
// SPORTS RECORDS
// =========================================================
// Kept temporarily.
// Later we will create a dedicated
// Sports & Dance page and move this there.
// =========================================================

router.get(
    '/sports-records',
    async (req, res) => {

        await renderRecordsPage(
            req,
            res,
            {
                className: 'sports'
            },
            {

                title:
                    'Sports Records',

                heading:
                    'Sports Records',

                intro:
                    'Students who achieved excellence in sports and represented the school at different levels.'

            }
        );

    }
);


// =========================================================
// EXPORT
// =========================================================

module.exports = router;