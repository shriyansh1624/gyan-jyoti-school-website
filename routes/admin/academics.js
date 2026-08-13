const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csrf = require('csurf');

const AcademicRecord =
    require('../../models/AcademicRecord');

const auth =
    require('../../middleware/auth');


// =========================================================
// AUTHENTICATION
// =========================================================

router.use(auth);


// =========================================================
// CSRF
// =========================================================

const csrfProtection = csrf({
    cookie: false
});


// =========================================================
// UPLOAD DIRECTORY
// =========================================================

const uploadDir = path.join(
    __dirname,
    '../../uploads/academics'
);


if (!fs.existsSync(uploadDir)) {

    fs.mkdirSync(
        uploadDir,
        {
            recursive: true
        }
    );

}


// =========================================================
// MULTER STORAGE
// =========================================================

const storage = multer.diskStorage({

    destination: function (
        req,
        file,
        cb
    ) {

        cb(
            null,
            uploadDir
        );

    },


    filename: function (
        req,
        file,
        cb
    ) {

        const extension =
            path.extname(
                file.originalname
            ).toLowerCase();


        const uniqueName =
            Date.now() +
            '-' +
            Math.round(
                Math.random() * 1e9
            ) +
            extension;


        cb(
            null,
            uniqueName
        );

    }

});


// =========================================================
// FILE FILTER
// =========================================================

const fileFilter = function (
    req,
    file,
    cb
) {

    const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp'
    ];


    const allowedExtensions = [
        '.jpg',
        '.jpeg',
        '.png',
        '.webp'
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
            'Only JPG, JPEG, PNG and WEBP images are allowed.'
        )
    );

};


// =========================================================
// MULTER
// =========================================================

const upload = multer({

    storage,

    fileFilter,

    limits: {

        fileSize:
            5 * 1024 * 1024,

        files: 1

    }

});


// =========================================================
// ALLOWED RECORD TYPES
// =========================================================

const allowedRankTypes = [

    '10th Board Topper',

    '12th Board Topper',

    'State Topper',

    'District Topper',

    'School Topper',

    'Sports Topper'

];


const allowedClasses = [

    '10th',

    '12th',

    'Other'

];


const allowedLevels = [

    'School',

    'District',

    'State',

    'National',

    'International'

];


// =========================================================
// VALIDATE OBJECT ID
// =========================================================

function isValidId(id) {

    return mongoose.Types.ObjectId.isValid(
        id
    );

}


// =========================================================
// CLEAN TEXT
// =========================================================

function cleanText(
    value,
    maxLength
) {

    if (
        value === undefined ||
        value === null
    ) {

        return '';

    }


    return String(value)
        .trim()
        .slice(
            0,
            maxLength
        );

}


// =========================================================
// PRIORITY
// =========================================================

function parsePriority(value) {

    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ''
    ) {

        return 0;

    }


    const priority =
        Number(value);


    if (
        !Number.isInteger(
            priority
        ) ||
        priority < 0 ||
        priority > 9999
    ) {

        return null;

    }


    return priority;

}


// =========================================================
// VALIDATE ACADEMIC RECORD
// =========================================================

function validateAcademicData(
    body
) {

    const studentName =
        cleanText(
            body.studentName,
            100
        );


    const className =
        cleanText(
            body.className,
            20
        );


    const year =
        cleanText(
            body.year,
            20
        );


    const batch =
        cleanText(
            body.batch,
            50
        );


    const rankType =
        cleanText(
            body.rankType,
            50
        );


    const percentage =
        cleanText(
            body.percentage,
            30
        );


    const stream =
        cleanText(
            body.stream,
            50
        );


    const position =
        cleanText(
            body.position,
            50
        );


    const achievement =
        cleanText(
            body.achievement,
            500
        );


    const sport =
        cleanText(
            body.sport,
            100
        );


    const level =
        cleanText(
            body.level,
            30
        );


    const priority =
        parsePriority(
            body.priority
        );


    // =====================================================
    // REQUIRED FIELDS
    // =====================================================

    if (!studentName) {

        return {
            valid: false,
            message:
                'Student name is required.'
        };

    }


    if (!className) {

        return {
            valid: false,
            message:
                'Class is required.'
        };

    }


    if (!year) {

        return {
            valid: false,
            message:
                'Year / Session is required.'
        };

    }


    if (!batch) {

        return {
            valid: false,
            message:
                'Batch is required.'
        };

    }


    if (!rankType) {

        return {
            valid: false,
            message:
                'Achievement type is required.'
        };

    }


    // =====================================================
    // ALLOWED VALUES
    // =====================================================

    if (
        !allowedClasses.includes(
            className
        )
    ) {

        return {
            valid: false,
            message:
                'Invalid class.'
        };

    }


    if (
        !allowedRankTypes.includes(
            rankType
        )
    ) {

        return {
            valid: false,
            message:
                'Invalid achievement type.'
        };

    }


    // =====================================================
    // LEVEL
    // =====================================================

    if (
        level &&
        !allowedLevels.includes(
            level
        )
    ) {

        return {
            valid: false,
            message:
                'Invalid achievement level.'
        };

    }


    // =====================================================
    // SPORTS VALIDATION
    // =====================================================

    if (
        rankType === 'Sports Topper' &&
        !sport
    ) {

        return {
            valid: false,
            message:
                'Sport name is required for sports records.'
        };

    }


    // =====================================================
    // PRIORITY
    // =====================================================

    if (
        priority === null
    ) {

        return {
            valid: false,
            message:
                'Priority must be a whole number between 0 and 9999.'
        };

    }


    // =====================================================
    // RETURN CLEAN DATA
    // =====================================================

    return {

        valid: true,

        data: {

            studentName,

            className,

            year,

            batch,

            rankType,

            percentage,

            stream,

            position,

            achievement,

            sport,

            level,

            priority

        }

    };

}


// =========================================================
// DELETE IMAGE SAFELY
// =========================================================

function deleteAcademicImage(
    imagePath
) {

    if (!imagePath) {

        return;

    }


    if (
        typeof imagePath !== 'string' ||
        !imagePath.startsWith(
            '/uploads/academics/'
        )
    ) {

        return;

    }


    const fileName =
        path.basename(
            imagePath
        );


    if (
        !fileName ||
        fileName !==
        path.basename(fileName)
    ) {

        return;

    }


    const filePath =
        path.join(
            uploadDir,
            fileName
        );


    const resolvedUploadDir =
        path.resolve(
            uploadDir
        ) +
        path.sep;


    const resolvedFilePath =
        path.resolve(
            filePath
        );


    if (
        !resolvedFilePath.startsWith(
            resolvedUploadDir
        )
    ) {

        return;

    }


    if (
        fs.existsSync(
            filePath
        )
    ) {

        try {

            fs.unlinkSync(
                filePath
            );

        }

        catch (error) {

            console.error(
                'Academic image delete error:',
                error
            );

        }

    }

}


// =========================================================
// DELETE NEWLY UPLOADED FILE
// =========================================================

function deleteUploadedFile(
    file
) {

    if (
        !file ||
        !file.filename
    ) {

        return;

    }


    const filePath =
        path.join(
            uploadDir,
            file.filename
        );


    if (
        fs.existsSync(
            filePath
        )
    ) {

        try {

            fs.unlinkSync(
                filePath
            );

        }

        catch (error) {

            console.error(
                'Academic uploaded file cleanup error:',
                error
            );

        }

    }

}


// =========================================================
// CSRF TOKEN HELPER
// =========================================================
//
// IMPORTANT:
// This route uses multipart/form-data for image uploads.
// Therefore Multer must parse the request before CSRF
// validation can read req.body._csrf.
// =========================================================

function multipartCsrf(
    req,
    res,
    next
) {

    return csrfProtection(
        req,
        res,
        next
    );

}


// =========================================================
// ACADEMICS DASHBOARD
// GET /admin/academics
// =========================================================

router.get(
    '/',
    csrfProtection,
    async (req, res) => {

        try {

            const records =
                await AcademicRecord.find()
                    .sort({
                        priority: 1,
                        year: -1,
                        createdAt: -1
                    })
                    .lean();


            return res.render(
                'admin/academics/index',
                {

                    title:
                        'Academic Achievements - Admin',

                    records,

                    csrfToken:
                        req.csrfToken()

                }
            );

        }

        catch (error) {

            console.error(
                'Academics dashboard error:',
                error
            );


            return res.status(500).send(
                'Error loading academic records'
            );

        }

    }
);


// =========================================================
// ADD PAGE
// GET /admin/academics/add
// =========================================================

router.get(
    '/add',
    csrfProtection,
    (req, res) => {

        return res.render(
            'admin/academics/add',
            {

                title:
                    'Add Academic Achievement',

                csrfToken:
                    req.csrfToken()

            }
        );

    }
);


// =========================================================
// ADD RECORD
// POST /admin/academics/add
// =========================================================

router.post(
    '/add',

    upload.single(
        'photo'
    ),

    multipartCsrf,

    async (req, res) => {

        try {

            const validation =
                validateAcademicData(
                    req.body
                );


            if (
                !validation.valid
            ) {

                deleteUploadedFile(
                    req.file
                );


                return res.status(400).send(
                    validation.message
                );

            }


            const data =
                validation.data;


            let photoPath = '';


            if (
                req.file
            ) {

                photoPath =
                    '/uploads/academics/' +
                    req.file.filename;

            }


            const record =
                new AcademicRecord({

                    studentName:
                        data.studentName,

                    className:
                        data.className,

                    year:
                        data.year,

                    batch:
                        data.batch,

                    rankType:
                        data.rankType,

                    percentage:
                        data.percentage,

                    stream:
                        data.stream,

                    position:
                        data.position,

                    achievement:
                        data.achievement,

                    photo:
                        photoPath,

                    sport:
                        data.sport,

                    level:
                        data.level,

                    priority:
                        data.priority,

                    enabled:
                        true

                });


            await record.save();


            return res.redirect(
                '/admin/academics'
            );

        }

        catch (error) {

            console.error(
                'Add academic record error:',
                error
            );


            deleteUploadedFile(
                req.file
            );


            return res.status(500).send(
                'Error adding academic record'
            );

        }

    }
);


// =========================================================
// EDIT PAGE
// GET /admin/academics/edit/:id
// =========================================================

router.get(
    '/edit/:id',
    csrfProtection,
    async (req, res) => {

        try {

            if (
                !isValidId(
                    req.params.id
                )
            ) {

                return res.status(400).send(
                    'Invalid academic record ID'
                );

            }


            const record =
                await AcademicRecord.findById(
                    req.params.id
                );


            if (!record) {

                return res.status(404).send(
                    'Academic record not found'
                );

            }


            return res.render(
                'admin/academics/edit',
                {

                    title:
                        'Edit Academic Achievement',

                    record,

                    csrfToken:
                        req.csrfToken()

                }
            );

        }

        catch (error) {

            console.error(
                'Edit academic page error:',
                error
            );


            return res.status(500).send(
                'Error loading academic record'
            );

        }

    }
);


// =========================================================
// UPDATE RECORD
// POST /admin/academics/edit/:id
// =========================================================

router.post(
    '/edit/:id',

    upload.single(
        'photo'
    ),

    multipartCsrf,

    async (req, res) => {

        try {

            if (
                !isValidId(
                    req.params.id
                )
            ) {

                deleteUploadedFile(
                    req.file
                );


                return res.status(400).send(
                    'Invalid academic record ID'
                );

            }


            const validation =
                validateAcademicData(
                    req.body
                );


            if (
                !validation.valid
            ) {

                deleteUploadedFile(
                    req.file
                );


                return res.status(400).send(
                    validation.message
                );

            }


            const data =
                validation.data;


            const record =
                await AcademicRecord.findById(
                    req.params.id
                );


            if (!record) {

                deleteUploadedFile(
                    req.file
                );


                return res.status(404).send(
                    'Academic record not found'
                );

            }


            const oldPhoto =
                record.photo || '';


            let photoPath =
                oldPhoto;


            if (
                req.file
            ) {

                photoPath =
                    '/uploads/academics/' +
                    req.file.filename;

            }


            record.studentName =
                data.studentName;

            record.className =
                data.className;

            record.year =
                data.year;

            record.batch =
                data.batch;

            record.rankType =
                data.rankType;

            record.percentage =
                data.percentage;

            record.stream =
                data.stream;

            record.position =
                data.position;

            record.achievement =
                data.achievement;

            record.sport =
                data.sport;

            record.level =
                data.level;

            record.priority =
                data.priority;

            record.photo =
                photoPath;


            await record.save();


            if (
                req.file &&
                oldPhoto &&
                oldPhoto !== photoPath
            ) {

                deleteAcademicImage(
                    oldPhoto
                );

            }


            return res.redirect(
                '/admin/academics'
            );

        }

        catch (error) {

            console.error(
                'Update academic record error:',
                error
            );


            deleteUploadedFile(
                req.file
            );


            return res.status(500).send(
                'Error updating academic record'
            );

        }

    }
);


// =========================================================
// DELETE RECORD
// POST /admin/academics/delete/:id
// =========================================================

router.post(
    '/delete/:id',

    csrfProtection,

    async (req, res) => {

        try {

            if (
                !isValidId(
                    req.params.id
                )
            ) {

                return res.status(400).send(
                    'Invalid academic record ID'
                );

            }


            const record =
                await AcademicRecord.findById(
                    req.params.id
                );


            if (!record) {

                return res.status(404).send(
                    'Academic record not found'
                );

            }


            await AcademicRecord.findByIdAndDelete(
                req.params.id
            );


            deleteAcademicImage(
                record.photo
            );


            return res.redirect(
                '/admin/academics'
            );

        }

        catch (error) {

            console.error(
                'Delete academic record error:',
                error
            );


            return res.status(500).send(
                'Error deleting academic record'
            );

        }

    }
);


// =========================================================
// UPDATE PRIORITY
// POST /admin/academics/priority/:id
// =========================================================

router.post(
    '/priority/:id',

    csrfProtection,

    async (req, res) => {

        try {

            if (
                !isValidId(
                    req.params.id
                )
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        'Invalid academic record ID'

                });

            }


            const priority =
                parsePriority(
                    req.body.priority
                );


            if (
                priority === null
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        'Invalid priority'

                });

            }


            const record =
                await AcademicRecord.findByIdAndUpdate(

                    req.params.id,

                    {
                        priority
                    },

                    {
                        new: true,

                        runValidators: true
                    }

                );


            if (!record) {

                return res.status(404).json({

                    success:
                        false,

                    message:
                        'Academic record not found'

                });

            }


            return res.json({

                success:
                    true

            });

        }

        catch (error) {

            console.error(
                'Academic priority update error:',
                error
            );


            return res.status(500).json({

                success:
                    false,

                message:
                    'Unable to update priority'

            });

        }

    }
);


// =========================================================
// MULTER ERROR HANDLER
// =========================================================

router.use(
    (
        error,
        req,
        res,
        next
    ) => {

        if (
            error instanceof multer.MulterError
        ) {

            if (
                error.code ===
                'LIMIT_FILE_SIZE'
            ) {

                return res.status(400).send(
                    'Image must be smaller than 5MB.'
                );

            }


            if (
                error.code ===
                'LIMIT_FILE_COUNT'
            ) {

                return res.status(400).send(
                    'Only one image can be uploaded.'
                );

            }


            return res.status(400).send(
                'Invalid file upload.'
            );

        }


        if (
            error &&
            error.message &&
            error.message.includes(
                'Only JPG'
            )
        ) {

            return res.status(400).send(
                error.message
            );

        }


        next(error);

    }
);


// =========================================================
// EXPORT
// =========================================================

module.exports = router;