const mongoose = require('mongoose');

const academicRecordSchema = new mongoose.Schema({

    // =====================================================
    // STUDENT
    // =====================================================

    studentName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },


    // =====================================================
    // RECORD CATEGORY
    // =====================================================
    // academic = 10th/12th/topper records
    // sports   = sports achievements
    // dance    = dance achievements

    recordType: {
        type: String,
        enum: [
            'academic',
            'sports',
            'dance'
        ],
        default: 'academic',
        required: true
    },


    // =====================================================
    // CLASS
    // =====================================================

    className: {
        type: String,
        enum: [
            '10th',
            '12th',
            'sports',
            'dance'
        ]
    },


    // =====================================================
    // YEAR / BATCH
    // =====================================================

    year: {
        type: String,
        required: true,
        trim: true
    },

    batch: {
        type: String,
        required: true,
        trim: true
    },


    // =====================================================
    // ACADEMIC RANK
    // =====================================================

    rankType: {
        type: String,
        enum: [
            'State Topper',
            'District Topper',
            'School Topper',
            'Sports Achievement',
            'Dance Achievement'
        ]
    },


    // =====================================================
    // RESULT / STREAM
    // =====================================================

    percentage: {
        type: String,
        trim: true
    },

    stream: {
        type: String,
        trim: true
    },


    // =====================================================
    // SPORTS / DANCE
    // =====================================================

    category: {
        type: String,
        trim: true
    },

    level: {
        type: String,
        enum: [
            'School',
            'District',
            'State',
            'National',
            'International'
        ]
    },

    position: {
        type: String,
        trim: true
    },

    competition: {
        type: String,
        trim: true
    },


    // =====================================================
    // ACHIEVEMENT
    // =====================================================

    achievement: {
        type: String,
        trim: true,
        maxlength: 1000
    },


    // =====================================================
    // PHOTO
    // =====================================================

    photo: {
        type: String,
        trim: true
    },


    // =====================================================
    // DISPLAY PRIORITY
    // =====================================================

    priority: {
        type: Number,
        default: 0
    }

}, {

    timestamps: true

});


// =========================================================
// INDEXES
// =========================================================

academicRecordSchema.index({
    recordType: 1,
    year: -1,
    priority: 1
});

academicRecordSchema.index({
    className: 1,
    rankType: 1,
    year: -1
});


// =========================================================
// MODEL
// =========================================================

module.exports =
    mongoose.model(
        'AcademicRecord',
        academicRecordSchema
    );