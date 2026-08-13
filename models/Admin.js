const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const adminSchema = new mongoose.Schema({

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },

    password: {
        type: String,
        required: true,
        minlength: 60
    },

    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
        default: 'Admin'
    },

    role: {
        type: String,
        enum: ['admin', 'superadmin'],
        default: 'admin'
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});


// HASH PASSWORD BEFORE SAVE
adminSchema.pre('save', async function (next) {

    try {

        if (!this.isModified('password')) {
            return next();
        }

        const saltRounds = 12;

        this.password = await bcrypt.hash(
            this.password,
            saltRounds
        );

        next();

    } catch (error) {

        next(error);

    }

});


// COMPARE PASSWORD
adminSchema.methods.comparePassword =
    async function (plainPassword) {

        return bcrypt.compare(
            plainPassword,
            this.password
        );

    };


module.exports = mongoose.model(
    'Admin',
    adminSchema
);