const mongoose = require('mongoose');


// =========================================================
// EVENT SCHEMA
// =========================================================

const eventSchema = new mongoose.Schema({

    // =====================================================
    // EVENT TITLE
    // =====================================================

    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150
    },


    // =====================================================
    // EVENT CATEGORY
    // =====================================================

    category: {
        type: String,
        required: true,

        enum: [
            'fun-fiesta',
            'sports',
            'national-celebration',
            'old-memory'
        ]
    },


    // =====================================================
    // DESCRIPTION
    // =====================================================

    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },


    // =====================================================
    // EVENT DATE
    // =====================================================

    date: {
        type: Date,
        required: true
    },


    // =====================================================
    // SESSION
    // =====================================================

    session: {
        type: String,
        trim: true,
        maxlength: 30
    },


    // =====================================================
    // BATCH
    // =====================================================

    batch: {
        type: String,
        trim: true,
        maxlength: 100
    },


    // =====================================================
    // COVER IMAGE
    // =====================================================
    // Single main image
    //
    // Example:
    // /uploads/events/cover-123456.jpg

    coverImage: {
        type: String,
        trim: true
    },


    // =====================================================
    // EVENT PHOTOS
    // =====================================================
    // Multiple photos

    photos: {
        type: [String],
        default: []
    },


    // =====================================================
    // EVENT VIDEOS
    // =====================================================
    // Multiple uploaded videos

    videos: {
        type: [String],
        default: []
    },


    // =====================================================
    // DISPLAY PRIORITY
    // =====================================================

    priority: {
        type: Number,
        default: 0
    },


    // =====================================================
    // PUBLISHED
    // =====================================================

    published: {
        type: Boolean,
        default: true
    }

}, {

    timestamps: true

});


// =========================================================
// INDEXES
// =========================================================

eventSchema.index({
    category: 1,
    date: -1,
    priority: 1
});


eventSchema.index({
    published: 1,
    category: 1
});


eventSchema.index({
    session: 1,
    batch: 1
});


// =========================================================
// MODEL
// =========================================================

module.exports =
    mongoose.model(
        'Event',
        eventSchema
    );