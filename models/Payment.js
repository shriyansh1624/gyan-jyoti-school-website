const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
    {
        // =====================================================
        // PAYMENT TYPE
        // =====================================================

        type: {
            type: String,
            enum: ['admission', 'enquiry'],
            required: true,
            index: true
        },

        // =====================================================
        // RELATED APPLICATION
        // =====================================================

        admission: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admission',
            default: null
        },

        enquiry: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Enquiry',
            default: null
        },

        // =====================================================
        // AMOUNT
        // =====================================================

        amount: {
            type: Number,
            required: true,
            min: 0
        },

        currency: {
            type: String,
            default: 'INR',
            uppercase: true
        },

        // =====================================================
        // PAYMENT METHOD
        // =====================================================

        method: {
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
        // PAYMENT STATUS
        // =====================================================

        status: {
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

        // =====================================================
        // TRANSACTION INFORMATION
        // =====================================================

        orderId: {
            type: String,
            trim: true,
            default: ''
        },

        transactionId: {
            type: String,
            trim: true,
            default: ''
        },

        gateway: {
            type: String,
            trim: true,
            default: 'demo'
        },

        // =====================================================
        // CASH PAYMENT INFORMATION
        // =====================================================

        receiptNumber: {
            type: String,
            trim: true,
            default: ''
        },

        receivedBy: {
            type: String,
            trim: true,
            default: ''
        },

        // =====================================================
        // EXTRA INFORMATION
        // =====================================================

        notes: {
            type: String,
            trim: true,
            maxlength: 500,
            default: ''
        },

        paidAt: {
            type: Date,
            default: null
        }
    },

    {
        timestamps: true
    }
);


// =========================================================
// INDEXES
// =========================================================

paymentSchema.index({
    type: 1,
    status: 1
});

paymentSchema.index({
    createdAt: -1
});

paymentSchema.index({
    orderId: 1
});

paymentSchema.index({
    transactionId: 1
});


// =========================================================
// EXPORT
// =========================================================

module.exports =
    mongoose.model(
        'Payment',
        paymentSchema
    );