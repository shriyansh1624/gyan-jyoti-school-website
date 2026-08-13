const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({

    // =====================================================
    // FACULTY NAME
    // =====================================================

    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },


    // =====================================================
    // ROLE / DESIGNATION
    // =====================================================

    role: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },


    // =====================================================
    // MAIN CATEGORY
    // =====================================================

    category: {
        type: String,
        required: true,

        enum: [
            'top-faculty',
            'incharge',
            'library-computing'
        ]
    },


    // =====================================================
    // ACADEMIC SECTION
    // =====================================================

    section: {
        type: String,

        enum: [
            'primary',
            'middle',
            'higher',
            'general'
        ],

        default: 'general'
    },


    // =====================================================
    // SPECIALIZATION
    // =====================================================

    specialization: {
        type: String,
        trim: true,
        maxlength: 150
    },


    // =====================================================
    // QUALITIES
    // =====================================================

    qualities: {
        type: [String],
        default: []
    },


    // =====================================================
    // DEPARTMENT
    // =====================================================

    department: {
        type: String,
        trim: true,
        maxlength: 150
    },


    // =====================================================
    // WHATSAPP NUMBER
    // =====================================================

    /*
     * Store the number with country code.
     *
     * Example:
     * 919876543210
     *
     * This will later be used to create:
     *
     * https://wa.me/919876543210
     *
     * No spaces, + sign or hyphens should be stored.
     */

    whatsappNumber: {
        type: String,
        trim: true,
        maxlength: 15,
        default: ''
    },


    // =====================================================
    // FACULTY IMAGE
    // =====================================================

    image: {
        type: String,
        trim: true,
        default: ''
    },


    // =====================================================
    // DISPLAY PRIORITY
    // =====================================================

    priority: {
        type: Number,
        default: 0
    }

}, {

    // Automatically creates:
    // createdAt
    // updatedAt

    timestamps: true

});


// =========================================================
// INDEXES
// =========================================================

// Faculty filtering
// Top Faculty / Incharge / Library & Computing

facultySchema.index({
    category: 1,
    section: 1
});


// =========================================================
// WHATSAPP INDEX
// =========================================================

// Useful for finding faculty having
// WhatsApp numbers registered.

facultySchema.index({
    whatsappNumber: 1
});


// =========================================================
// MODEL
// =========================================================

module.exports = mongoose.model(
    'Faculty',
    facultySchema
);