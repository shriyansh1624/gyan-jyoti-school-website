const express = require('express');
const router = express.Router();

const Faculty = require('../models/Faculty');
const SchoolInfo = require('../models/SchoolInfo');

// =========================================================
// PUBLIC FACULTY PAGE
// GET /faculty
// =========================================================

router.get('/', async (req, res) => {

    console.log('🔥 FACULTY ROUTE HIT');

    try {

        // =====================================================
        // SCHOOL INFO
        // =====================================================

        const schoolInfo = await SchoolInfo.findOne();


        // =====================================================
        // TOP 5 FACULTY
        // =====================================================

        const topFaculties = await Faculty.find({
            category: 'top-faculty'
        })
        .sort({ priority: 1 })
        .limit(5);


        // =====================================================
        // SECTION INCHARGES
        // =====================================================

        const primaryIncharges = await Faculty.find({
            category: 'incharge',
            section: 'primary'
        })
        .sort({ priority: 1 });


        const middleIncharges = await Faculty.find({
            category: 'incharge',
            section: 'middle'
        })
        .sort({ priority: 1 });


        const higherIncharges = await Faculty.find({
            category: 'incharge',
            section: 'higher'
        })
        .sort({ priority: 1 });


        // =====================================================
        // PRIMARY FACULTY
        // =====================================================

        const primaryFaculties = await Faculty.find({
            category: 'top-faculty',
            section: 'primary'
        })
        .sort({ priority: 1 })
        .limit(4);


        // =====================================================
        // MIDDLE FACULTY
        // =====================================================

        const middleFaculties = await Faculty.find({
            category: 'top-faculty',
            section: 'middle'
        })
        .sort({ priority: 1 })
        .limit(4);


        // =====================================================
        // HIGHER FACULTY
        // =====================================================

        const higherFaculties = await Faculty.find({
            category: 'top-faculty',
            section: 'higher'
        })
        .sort({ priority: 1 })
        .limit(4);


        // =====================================================
        // LIBRARY & COMPUTING
        // =====================================================

        const libraryComputing = await Faculty.find({
            category: 'library-computing'
        })
        .sort({ priority: 1 });


        // =====================================================
        // TOTAL FACULTY COUNT
        // =====================================================

        const facultyCount = await Faculty.countDocuments();


        // =====================================================
        // DEBUG
        // =====================================================

        console.log('✅ FACULTY DATA READY');

        console.log({
            topFaculties: topFaculties.length,
            primaryIncharges: primaryIncharges.length,
            middleIncharges: middleIncharges.length,
            higherIncharges: higherIncharges.length,
            primaryFaculties: primaryFaculties.length,
            middleFaculties: middleFaculties.length,
            higherFaculties: higherFaculties.length,
            libraryComputing: libraryComputing.length,
            facultyCount
        });


        // =====================================================
        // RENDER PAGE
        // =====================================================

        res.render('faculty/faculty', {

            title: 'Faculty - Gyan Jyoti School',

            active: 'faculty',

            schoolInfo,

            topFaculties,

            primaryIncharges,
            middleIncharges,
            higherIncharges,

            primaryFaculties,
            middleFaculties,
            higherFaculties,

            libraryComputing,

            facultyCount

        });


    } catch (error) {

        console.error(
            '🔥 FACULTY ERROR:',
            error
        );

        res.status(500).send(
            error.stack || error.message
        );

    }

});


module.exports = router;