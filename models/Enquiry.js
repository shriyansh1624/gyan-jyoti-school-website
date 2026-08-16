const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema(
    {
        // =====================================================
        // ENQUIRY DETAILS
        // =====================================================

        name: {
            type: String,
            required: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            trim: true,
            match: /^[0-9]{10}$/
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: ''
        },

        message: {
            type: String,
            required: true,
            trim: true
        },

        // =====================================================
        // PAYMENT
        // =====================================================

        paymentStatus: {
            type: String,
            enum: [
                'pending',
                'paid',
                'failed',
                'cancelled',
                'refunded'
            ],
            default: 'pending',
            index: true
        },

        payment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Payment',
            default: null
        },

        paymentAmount: {
            type: Number,
            min: 0,
            default: 0
        },

        paymentMethod: {
            type: String,
            enum: [
                'online',
                'upi',
                'netbanking',
                'card',
                'cash'
            ],
            default: 'online'
        },

        // =====================================================
        // ENQUIRY STATUS
        // =====================================================

        enquiryStatus: {
            type: String,
            enum: [
                'new',
                'contacted',
                'in-progress',
                'resolved',
                'closed'
            ],
            default: 'new',
            index: true
        }
    },

    {
        timestamps: true
    }
);


// =========================================================
// INDEXES
// =========================================================
// paymentStatus and enquiryStatus already have
// index:true above, so DON'T define them again here.

enquirySchema.index({
    createdAt: -1
});

enquirySchema.index({
    phone: 1
});


// =========================================================
// EXPORT
// =========================================================

module.exports =
    mongoose.model(
        'Enquiry',
        enquirySchema
    );