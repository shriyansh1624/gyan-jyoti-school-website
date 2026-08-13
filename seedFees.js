// =========================================================
// LOAD ENVIRONMENT VARIABLES
// =========================================================

require('dotenv').config();


// =========================================================
// DNS FIX
// =========================================================

const dns = require('dns');

dns.setServers([
    '8.8.8.8',
    '1.1.1.1'
]);


// =========================================================
// MODULES
// =========================================================

const mongoose = require('mongoose');

const FeeStructure =
    require('./models/FeeStructure');


// =========================================================
// FEE DATA
// =========================================================

const fees = [

    // =====================================================
    // PRIMARY
    // =====================================================

    {
        title: 'Primary',

        section: 'primary',

        classRange:
            'Class 1st to 5th',

        session:
            '2026-27',

        priority: 1,

        icon:
            'fas fa-child',

        published:
            true,

        fees: [

            {
                name:
                    'Admission Fee',

                amount:
                    3000
            },

            {
                name:
                    'Monthly Tuition Fee',

                amount:
                    900
            },

            {
                name:
                    'Exam Fee',

                amount:
                    1000
            },

            {
                name:
                    'Activity Fee',

                amount:
                    800
            }

        ],

        annualApprox:
            15600,

        notes:
            'Transport, uniform and books charges may be separate.'

    },


    // =====================================================
    // MIDDLE
    // =====================================================

    {
        title: 'Middle',

        section: 'middle',

        classRange:
            'Class 6th to 8th',

        session:
            '2026-27',

        priority: 2,

        icon:
            'fas fa-book-open',

        published:
            true,

        fees: [

            {
                name:
                    'Admission Fee',

                amount:
                    3500
            },

            {
                name:
                    'Monthly Tuition Fee',

                amount:
                    1100
            },

            {
                name:
                    'Exam Fee',

                amount:
                    1200
            },

            {
                name:
                    'Activity Fee',

                amount:
                    1000
            }

        ],

        annualApprox:
            18900,

        notes:
            'Transport, uniform and books charges may be separate.'

    },


    // =====================================================
    // SECONDARY
    // =====================================================

    {
        title: 'Secondary',

        section: 'secondary',

        classRange:
            'Class 9th to 10th',

        session:
            '2026-27',

        priority: 3,

        icon:
            'fas fa-user-graduate',

        published:
            true,

        fees: [

            {
                name:
                    'Admission Fee',

                amount:
                    4000
            },

            {
                name:
                    'Monthly Tuition Fee',

                amount:
                    1300
            },

            {
                name:
                    'Exam Fee',

                amount:
                    1500
            },

            {
                name:
                    'Lab / Activity Fee',

                amount:
                    1200
            }

        ],

        annualApprox:
            22300,

        notes:
            'Transport, uniform and books charges may be separate.'

    },


    // =====================================================
    // SENIOR SECONDARY
    // =====================================================

    {
        title:
            'Senior Secondary',

        section:
            'senior-secondary',

        classRange:
            'Class 11th to 12th',

        session:
            '2026-27',

        priority: 4,

        icon:
            'fas fa-graduation-cap',

        published:
            true,

        fees: [

            {
                name:
                    'Admission Fee',

                amount:
                    5000
            },

            {
                name:
                    'Monthly Tuition Fee',

                amount:
                    1600
            },

            {
                name:
                    'Exam Fee',

                amount:
                    1800
            },

            {
                name:
                    'Lab / Practical Fee',

                amount:
                    2000
            }

        ],

        annualApprox:
            28000,

        notes:
            'Transport, uniform and books charges may be separate.'

    }

];


// =========================================================
// DATABASE CONNECTION
// =========================================================

async function connectDatabase() {

    if (!process.env.MONGO_URI) {

        throw new Error(
            'MONGO_URI is missing from .env'
        );

    }


    console.log(
        '🔌 Connecting to MongoDB...'
    );


    await mongoose.connect(
        process.env.MONGO_URI,
        {

            serverSelectionTimeoutMS:
                15000,

            connectTimeoutMS:
                15000,

            socketTimeoutMS:
                20000

        }
    );


    console.log(
        '✅ MongoDB connected'
    );

}


// =========================================================
// SEED FEES
// =========================================================

async function seedFees() {

    try {

        await connectDatabase();


        console.log(
            '\n📚 Checking fee structures...\n'
        );


        for (
            const fee of fees
        ) {


            // =============================================
            // CHECK EXISTING RECORD
            // =============================================

            const existing =
                await FeeStructure.findOne({

                    section:
                        fee.section,

                    session:
                        fee.session

                });


            // =============================================
            // IF EXISTS
            // =============================================

            if (existing) {

                console.log(
                    `⚠️ ${fee.title} already exists - skipped`
                );

                continue;

            }


            // =============================================
            // CREATE
            // =============================================

            const created =
                await FeeStructure.create(
                    fee
                );


            console.log(
                `✅ Added: ${created.title}`
            );

        }


        // =================================================
        // FINAL COUNT
        // =================================================

        const count =
            await FeeStructure.countDocuments();


        console.log(
            '\n----------------------------------------'
        );

        console.log(
            `📊 Total Fee Structures: ${count}`
        );

        console.log(
            '----------------------------------------'
        );

        console.log(
            '\n🎉 Fee seeding completed successfully!'
        );


    } catch (error) {

        console.error(
            '\n❌ Fee seeding failed:'
        );

        console.error(
            error.message
        );


        if (
            error.message &&
            error.message.includes(
                'querySrv'
            )
        ) {

            console.error(
                '\n⚠️ MongoDB SRV/DNS connection problem.'
            );

            console.error(
                'Try another network/mobile hotspot or check MongoDB Atlas.'
            );

        }


    } finally {

        // =================================================
        // DISCONNECT
        // =================================================

        try {

            await mongoose.disconnect();

            console.log(
                '🔌 MongoDB disconnected'
            );

        } catch (disconnectError) {

            console.error(
                '❌ MongoDB disconnect error:',
                disconnectError.message
            );

        }

    }

}


// =========================================================
// RUN
// =========================================================

seedFees();