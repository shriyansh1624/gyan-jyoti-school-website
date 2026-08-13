const mongoose = require("mongoose");

const popupSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true,
        trim: true
    },

    subtitle: {
        type: String,
        default: "",
        trim: true
    },

    image: {
        type: String,
        required: true
    },

    buttonText: {
        type: String,
        default: "Apply Now"
    },

    buttonLink: {
        type: String,
        default: "/admission/process"
    },

    enabled: {
        type: Boolean,
        default: true
    },

    showOnce: {
        type: Boolean,
        default: true
    },

    delay: {
        type: Number,
        default: 1500
    },

    startDate: {
        type: Date,
        default: Date.now
    },

    endDate: {
        type: Date,
        default: null
    },

    priority: {
        type: Number,
        default: 1
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("Popup", popupSchema);