const multer = require("multer");
const path = require("path");
const fs = require("fs");

/*
=========================================================
POPUP UPLOAD DIRECTORY
=========================================================

IMPORTANT:
app.js serves:

/uploads
    ->
/uploads folder

So popup images MUST be physically stored in:

uploads/popups

NOT:

public/uploads/popups
*/

const uploadDir = path.join(
    __dirname,
    "..",
    "uploads",
    "popups"
);


/*
=========================================================
CREATE DIRECTORY
=========================================================
*/

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {
        recursive: true
    });
}


/*
=========================================================
MULTER STORAGE
=========================================================
*/

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(null, uploadDir);

    },


    filename: (req, file, cb) => {

        const extension =
            path.extname(
                file.originalname
            ).toLowerCase();

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(
                Math.random() * 1E9
            ) +
            extension;

        cb(
            null,
            uniqueName
        );

    }

});


/*
=========================================================
FILE FILTER
=========================================================
*/

const fileFilter = (req, file, cb) => {

    const allowedTypes = [

        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"

    ];


    const allowedExtensions = [

        ".jpg",
        ".jpeg",
        ".png",
        ".webp"

    ];


    const extension =
        path.extname(
            file.originalname
        ).toLowerCase();


    if (
        allowedTypes.includes(
            file.mimetype
        ) &&
        allowedExtensions.includes(
            extension
        )
    ) {

        return cb(
            null,
            true
        );

    }


    return cb(
        new Error(
            "Only JPG, JPEG, PNG and WEBP images are allowed"
        )
    );

};


/*
=========================================================
MULTER
=========================================================
*/

const upload = multer({

    storage,

    fileFilter,

    limits: {

        fileSize:
            5 * 1024 * 1024,

        files: 1

    }

});


module.exports = upload;