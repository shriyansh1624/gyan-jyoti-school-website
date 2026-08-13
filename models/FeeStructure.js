const mongoose = require('mongoose');


// =========================================================
// FEE ITEM SCHEMA
// =========================================================

const feeItemSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },

        amount: {
            type: Number,
            required: true,
            min: 0
        }
    },
    {
        _id: false
    }
);


// =========================================================
// FEE STRUCTURE SCHEMA
// =========================================================

const feeStructureSchema = new mongoose.Schema(
    {

        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },


        section: {
            type: String,
            required: true,

            enum: [
                'primary',
                'middle',
                'secondary',
                'senior-secondary'
            ]
        },


        classRange: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50
        },


        session: {
            type: String,
            required: true,
            trim: true,
            maxlength: 20
        },


        priority: {
            type: Number,
            default: 0,
            min: 0
        },


        icon: {
            type: String,
            default: 'fas fa-graduation-cap',
            trim: true
        },


        published: {
            type: Boolean,
            default: true
        },


        fees: {
            type: [feeItemSchema],
            default: []
        },


        annualApprox: {
            type: Number,
            required: true,
            min: 0
        },


        notes: {
            type: String,
            trim: true,
            maxlength: 500,
            default: ''
        }

    },
    {
        timestamps: true
    }
);


// =========================================================
// INDEXES
// =========================================================

feeStructureSchema.index({
    session: 1,
    section: 1
});


feeStructureSchema.index({
    priority: 1
});


feeStructureSchema.index({
    published: 1
});


// =========================================================
// EXPORT
// =========================================================

module.exports =
    mongoose.model(
        'FeeStructure',
        feeStructureSchema
    );