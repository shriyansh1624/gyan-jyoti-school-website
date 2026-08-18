const multer = require("multer");
const path = require("path");
const fs = require("fs");


// =========================================================
// POPUP UPLOAD DIRECTORY
// =========================================================

const uploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "popups"
);


// =========================================================
// CREATE DIRECTORY IF NOT EXISTS
// =========================================================

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {
        recursive: true
    });
}


// =========================================================
// STORAGE
// =========================================================

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(null, uploadDir);

    },

    filename: (req, file, cb) => {

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1E9);

        const extension =
            path.extname(file.originalname).toLowerCase();

        cb(
            null,
            uniqueName + extension
        );

    }

});


// =========================================================
// FILE FILTER
// =========================================================

const fileFilter = (req, file, cb) => {

    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    ];

    if (allowedTypes.includes(file.mimetype)) {

        cb(null, true);

    } else {

        cb(
            new Error(
                "Only JPG, PNG and WEBP images are allowed"
            )
        );

    }

};


// =========================================================
// MULTER
// =========================================================

module.exports = multer({

    storage,

    fileFilter,

    limits: {

        fileSize: 5 * 1024 * 1024

    }

});