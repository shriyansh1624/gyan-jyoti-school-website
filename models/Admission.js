const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema(
    {
        // =====================================================
        // STUDENT DETAILS
        // =====================================================

        studentName: {
            type: String,
            required: true,
            trim: true
        },

        class: {
            type: String,
            required: true,
            trim: true
        },

        // =====================================================
        // PARENT DETAILS
        // =====================================================

        parentName: {
            type: String,
            required: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: ''
        },

        address: {
            type: String,
            trim: true,
            default: ''
        },

        // =====================================================
        // DOCUMENT
        // =====================================================

        document: {
            type: String,
            default: null
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
        // APPLICATION STATUS
        // =====================================================

        applicationStatus: {
            type: String,
            enum: [
                'pending',
                'under-review',
                'approved',
                'rejected'
            ],
            default: 'pending',
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
// paymentStatus and applicationStatus already have
// index:true above, so DON'T define them again here.

admissionSchema.index({
    createdAt: -1
});

admissionSchema.index({
    phone: 1
});


// =========================================================
// EXPORT
// =========================================================

module.exports =
    mongoose.model(
        'Admission',
        admissionSchema
    );