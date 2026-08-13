const express = require('express');
const router = express.Router();

const FeeStructure = require('../models/FeeStructure');
const SchoolInfo = require('../models/SchoolInfo');

// =========================================================
// HELPER
// =========================================================

async function getSchoolInfo() {
    try {
        return await SchoolInfo.findOne().lean();
    } catch (error) {
        console.error('❌ Error loading SchoolInfo:', error);
        return null;
    }
}

// =========================================================
// FEES PAGE
// GET /fees
// =========================================================

router.get('/', async (req, res) => {

    try {

        // -------------------------------------------------
        // GET PUBLISHED FEE STRUCTURES
        // -------------------------------------------------

        const feeStructures = await FeeStructure.find({
            published: true
        })
        .sort({
            priority: 1,
            section: 1
        })
        .lean();


        // -------------------------------------------------
        // GET SCHOOL INFORMATION
        // -------------------------------------------------

        const schoolInfo = await getSchoolInfo();


        // -------------------------------------------------
        // RENDER
        // -------------------------------------------------

        return res.render('fees', {

            title: 'Fees Structure',

            active: 'admission',

            feeStructures: feeStructures || [],

            schoolInfo: schoolInfo || null

        });

    } catch (error) {

        console.error(
            '❌ Error loading fees page:',
            error
        );

        return res.status(500).send(
            'Error loading Fees Structure'
        );

    }

});


// =========================================================
// EXPORT
// =========================================================

module.exports = router;