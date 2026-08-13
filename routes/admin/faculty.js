const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Faculty = require('../../models/Faculty');
const auth = require('../../middleware/auth');


// =========================================================
// AUTHENTICATION
// =========================================================

// Extra protection.
// app.js already protects this router, but keeping auth here
// makes the router itself protected as well.

router.use(auth);


// =========================================================
// FACULTY UPLOAD DIRECTORY
// =========================================================

const uploadDir = path.join(
    __dirname,
    '../../uploads/faculty'
);


// =========================================================
// CREATE DIRECTORY IF IT DOES NOT EXIST
// =========================================================

if (!fs.existsSync(uploadDir)) {

    fs.mkdirSync(uploadDir, {
        recursive: true
    });

}


// =========================================================
// MULTER STORAGE
// =========================================================

const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        cb(null, uploadDir);

    },


    filename: function (req, file, cb) {

        const extension =
            path.extname(
                file.originalname
            ).toLowerCase();


        const uniqueName =
            Date.now() +
            '-' +
            Math.round(Math.random() * 1e9) +
            extension;


        cb(null, uniqueName);

    }

});


// =========================================================
// FILE FILTER
// =========================================================

const fileFilter = function (req, file, cb) {

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
// MULTER CONFIGURATION
// =========================================================

const upload = multer({

    storage,

    fileFilter,

    limits: {

        // Maximum image size = 5 MB
        fileSize: 5 * 1024 * 1024,

        // Only one image is accepted
        files: 1

    }

});


// =========================================================
// ALLOWED VALUES
// =========================================================

const allowedCategories = [
    'top-faculty',
    'incharge',
    'library-computing'
];


const allowedSections = [
    'primary',
    'middle',
    'higher',
    'general'
];


// =========================================================
// HELPER — VALIDATE OBJECT ID
// =========================================================

function isValidId(id) {

    return mongoose.Types.ObjectId.isValid(
        id
    );

}


// =========================================================
// HELPER — CLEAN TEXT
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
// HELPER — VALIDATE FACULTY TEXT
// =========================================================

function isValidPersonName(value) {

    return /^[A-Za-z][A-Za-z\s.'-]{1,59}$/.test(
        value
    );

}


// =========================================================
// HELPER — VALIDATE ROLE
// =========================================================

function isValidRole(value) {

    return (
        value.length >= 2 &&
        value.length <= 100
    );

}


// =========================================================
// HELPER — VALIDATE PRIORITY
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
        !Number.isInteger(priority) ||
        priority < 0 ||
        priority > 9999
    ) {

        return null;

    }


    return priority;

}


// =========================================================
// HELPER — QUALITIES
// =========================================================

function parseQualities(qualities) {

    if (!qualities) {

        return [];

    }


    let qualitiesArray;


    if (Array.isArray(qualities)) {

        qualitiesArray =
            qualities;

    } else {

        qualitiesArray =
            String(qualities)
                .split(',');

    }


    qualitiesArray =
        qualitiesArray
            .map(item =>
                String(item)
                    .trim()
                    .slice(
                        0,
                        100
                    )
            )
            .filter(Boolean);


    // Maximum 20 qualities
    if (
        qualitiesArray.length > 20
    ) {

        qualitiesArray =
            qualitiesArray.slice(
                0,
                20
            );

    }


    return qualitiesArray;

}


// =========================================================
// HELPER — DELETE FACULTY IMAGE
// =========================================================

function deleteFacultyImage(
    imagePath
) {

    if (!imagePath) {

        return;

    }


    // Only delete files belonging to our faculty folder.
    if (
        typeof imagePath !== 'string' ||
        !imagePath.startsWith(
            '/uploads/faculty/'
        )
    ) {

        return;

    }


    const fileName =
        path.basename(
            imagePath
        );


    // Prevent path traversal.
    if (
        !fileName ||
        fileName !== path.basename(
            fileName
        )
    ) {

        return;

    }


    const filePath =
        path.join(
            uploadDir,
            fileName
        );


    // Extra safety check.
    const resolvedUploadDir =
        path.resolve(
            uploadDir
        ) + path.sep;

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

        } catch (error) {

            console.error(
                'Faculty image delete error:',
                error
            );

        }

    }

}


// =========================================================
// HELPER — DELETE NEWLY UPLOADED IMAGE
// IF DATABASE OPERATION FAILS
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

        } catch (error) {

            console.error(
                'Uploaded file cleanup error:',
                error
            );

        }

    }

}


// =========================================================
// HELPER — VALIDATE FACULTY DATA
// =========================================================

function validateFacultyData(
    body
) {

    const name =
        cleanText(
            body.name,
            60
        );


    const role =
        cleanText(
            body.role,
            100
        );


    const category =
        cleanText(
            body.category,
            30
        );


    const section =
        cleanText(
            body.section ||
            'general',
            20
        );


    const specialization =
        cleanText(
            body.specialization,
            150
        );


    const department =
        cleanText(
            body.department,
            150
        );


    // =====================================================
    // WHATSAPP NUMBER
    // =====================================================

    const whatsappNumber =
        cleanText(
            body.whatsappNumber,
            15
        );


    const priority =
        parsePriority(
            body.priority
        );


    const qualities =
        parseQualities(
            body.qualities
        );


    // ---------------------------------------------
    // NAME
    // ---------------------------------------------

    if (
        !isValidPersonName(
            name
        )
    ) {

        return {

            valid: false,

            message:
                'Invalid faculty name.'

        };

    }


    // ---------------------------------------------
    // ROLE
    // ---------------------------------------------

    if (
        !isValidRole(
            role
        )
    ) {

        return {

            valid: false,

            message:
                'Invalid faculty role.'

        };

    }


    // ---------------------------------------------
    // CATEGORY
    // ---------------------------------------------

    if (
        !allowedCategories.includes(
            category
        )
    ) {

        return {

            valid: false,

            message:
                'Invalid faculty category.'

        };

    }


    // ---------------------------------------------
    // SECTION
    // ---------------------------------------------

    if (
        !allowedSections.includes(
            section
        )
    ) {

        return {

            valid: false,

            message:
                'Invalid faculty section.'

        };

    }


    // ---------------------------------------------
    // SPECIALIZATION
    // ---------------------------------------------

    if (
        specialization.length > 150
    ) {

        return {

            valid: false,

            message:
                'Specialization is too long.'

        };

    }


    // ---------------------------------------------
    // DEPARTMENT
    // ---------------------------------------------

    if (
        department.length > 150
    ) {

        return {

            valid: false,

            message:
                'Department is too long.'

        };

    }


    // ---------------------------------------------
    // WHATSAPP NUMBER
    // ---------------------------------------------

    /*
     * Expected format:
     *
     * 919876543210
     *
     * Digits only.
     *
     * 10 to 15 digits are allowed.
     */

    if (
        whatsappNumber &&
        !/^\d{10,15}$/.test(
            whatsappNumber
        )
    ) {

        return {

            valid: false,

            message:
                'WhatsApp number must contain 10 to 15 digits only.'

        };

    }


    // ---------------------------------------------
    // PRIORITY
    // ---------------------------------------------

    if (
        priority === null
    ) {

        return {

            valid: false,

            message:
                'Priority must be a whole number between 0 and 9999.'

        };

    }


    return {

        valid: true,

        data: {

            name,

            role,

            category,

            section,

            specialization,

            department,

            whatsappNumber,

            priority,

            qualities

        }

    };

}


// =========================================================
// FACULTY MANAGEMENT DASHBOARD
// GET /admin/faculty
// =========================================================

router.get(
    '/',
    async (req, res) => {

        try {

            const faculties =
                await Faculty.find()
                    .sort({

                        priority: 1,

                        createdAt: -1

                    })
                    .lean();


            res.render(
                'admin/faculty',
                {

                    title:
                        'Faculty Management - Admin',

                    faculties

                }
            );


        } catch (error) {

            console.error(
                'Faculty dashboard error:',
                error
            );


            res.status(
                500
            ).send(
                'Error loading faculty management'
            );

        }

    }
);
// =========================================================
// ADD FACULTY
// POST /admin/faculty/add
// =========================================================

router.post(
    '/add',
    upload.single('image'),
    async (req, res) => {

        try {

            const validation =
                validateFacultyData(
                    req.body
                );


            if (
                !validation.valid
            ) {

                deleteUploadedFile(
                    req.file
                );


                return res.status(
                    400
                ).send(
                    validation.message
                );

            }


            const data =
                validation.data;


            // ---------------------------------------------
            // IMAGE PATH
            // ---------------------------------------------

            let imagePath = '';


            if (
                req.file
            ) {

                imagePath =
                    '/uploads/faculty/' +
                    req.file.filename;

            }


            // ---------------------------------------------
            // CREATE FACULTY
            // ---------------------------------------------

            const faculty =
                new Faculty({

                    name:
                        data.name,

                    role:
                        data.role,

                    category:
                        data.category,

                    section:
                        data.section,

                    specialization:
                        data.specialization,

                    department:
                        data.department,

                    whatsappNumber:
                        data.whatsappNumber,

                    image:
                        imagePath,

                    priority:
                        data.priority,

                    qualities:
                        data.qualities

                });


            await faculty.save();


            return res.redirect(
                '/admin/faculty'
            );


        } catch (error) {

            console.error(
                'Add faculty error:',
                error
            );


            // Remove uploaded image if
            // database save fails.
            deleteUploadedFile(
                req.file
            );


            return res.status(
                500
            ).send(
                'Error adding faculty'
            );

        }

    }
);


// =========================================================
// EDIT FACULTY PAGE
// GET /admin/faculty/edit/:id
// =========================================================

router.get(
    '/edit/:id',
    async (req, res) => {

        try {

            // ---------------------------------------------
            // ID VALIDATION
            // ---------------------------------------------

            if (
                !isValidId(
                    req.params.id
                )
            ) {

                return res.status(
                    400
                ).send(
                    'Invalid faculty ID'
                );

            }


            // ---------------------------------------------
            // FIND FACULTY
            // ---------------------------------------------

            const faculty =
                await Faculty.findById(
                    req.params.id
                );


            if (
                !faculty
            ) {

                return res.status(
                    404
                ).send(
                    'Faculty not found'
                );

            }


            return res.render(
                'admin/faculty-edit',
                {

                    title:
                        'Edit Faculty - Admin',

                    faculty

                }
            );


        } catch (error) {

            console.error(
                'Edit faculty page error:',
                error
            );


            return res.status(
                500
            ).send(
                'Error loading faculty'
            );

        }

    }
);


// =========================================================
// UPDATE FACULTY
// POST /admin/faculty/edit/:id
// =========================================================

router.post(
    '/edit/:id',
    upload.single('image'),
    async (req, res) => {

        try {

            // ---------------------------------------------
            // ID VALIDATION
            // ---------------------------------------------

            if (
                !isValidId(
                    req.params.id
                )
            ) {

                deleteUploadedFile(
                    req.file
                );


                return res.status(
                    400
                ).send(
                    'Invalid faculty ID'
                );

            }


            // ---------------------------------------------
            // VALIDATE INPUT
            // ---------------------------------------------

            const validation =
                validateFacultyData(
                    req.body
                );


            if (
                !validation.valid
            ) {

                deleteUploadedFile(
                    req.file
                );


                return res.status(
                    400
                ).send(
                    validation.message
                );

            }


            const data =
                validation.data;


            // ---------------------------------------------
            // FIND FACULTY
            // ---------------------------------------------

            const faculty =
                await Faculty.findById(
                    req.params.id
                );


            if (
                !faculty
            ) {

                deleteUploadedFile(
                    req.file
                );


                return res.status(
                    404
                ).send(
                    'Faculty not found'
                );

            }


            // ---------------------------------------------
            // OLD IMAGE
            // ---------------------------------------------

            const oldImage =
                faculty.image ||
                '';


            // ---------------------------------------------
            // NEW IMAGE
            // ---------------------------------------------

            let imagePath =
                oldImage;


            if (
                req.file
            ) {

                imagePath =
                    '/uploads/faculty/' +
                    req.file.filename;

            }


            // ---------------------------------------------
            // UPDATE FIELDS
            // ---------------------------------------------

            faculty.name =
                data.name;


            faculty.role =
                data.role;


            faculty.category =
                data.category;


            faculty.section =
                data.section;


            faculty.specialization =
                data.specialization;


            faculty.department =
                data.department;


            faculty.whatsappNumber =
                data.whatsappNumber;


            faculty.image =
                imagePath;


            faculty.priority =
                data.priority;


            faculty.qualities =
                data.qualities;


            // ---------------------------------------------
            // SAVE DATABASE
            // ---------------------------------------------

            await faculty.save();


            // ---------------------------------------------
            // DELETE OLD IMAGE
            // ONLY AFTER SUCCESSFUL SAVE
            // ---------------------------------------------

            if (
                req.file &&
                oldImage &&
                oldImage !== imagePath
            ) {

                deleteFacultyImage(
                    oldImage
                );

            }


            return res.redirect(
                '/admin/faculty'
            );


        } catch (error) {

            console.error(
                'Update faculty error:',
                error
            );
                        // ---------------------------------------------
            // REMOVE NEWLY UPLOADED IMAGE
            // IF UPDATE FAILS
            // ---------------------------------------------

            deleteUploadedFile(
                req.file
            );


            return res.status(
                500
            ).send(
                'Error updating faculty'
            );

        }

    }
);


// =========================================================
// DELETE FACULTY
// POST /admin/faculty/delete/:id
// =========================================================

router.post(
    '/delete/:id',
    async (req, res) => {

        try {

            // ---------------------------------------------
            // ID VALIDATION
            // ---------------------------------------------

            if (
                !isValidId(
                    req.params.id
                )
            ) {

                return res.status(
                    400
                ).send(
                    'Invalid faculty ID'
                );

            }


            // ---------------------------------------------
            // FIND FACULTY
            // ---------------------------------------------

            const faculty =
                await Faculty.findById(
                    req.params.id
                );


            if (
                !faculty
            ) {

                return res.status(
                    404
                ).send(
                    'Faculty not found'
                );

            }


            // ---------------------------------------------
            // STORE IMAGE PATH
            // BEFORE DELETE
            // ---------------------------------------------

            const imagePath =
                faculty.image ||
                '';


            // ---------------------------------------------
            // DELETE DATABASE RECORD
            // ---------------------------------------------

            await Faculty.findByIdAndDelete(
                req.params.id
            );


            // ---------------------------------------------
            // DELETE FACULTY IMAGE
            // AFTER DATABASE DELETE
            // ---------------------------------------------

            if (
                imagePath
            ) {

                deleteFacultyImage(
                    imagePath
                );

            }


            return res.redirect(
                '/admin/faculty'
            );


        } catch (error) {

            console.error(
                'Delete faculty error:',
                error
            );


            return res.status(
                500
            ).send(
                'Error deleting faculty'
            );

        }

    }
);


// =========================================================
// DELETE FACULTY IMAGE ONLY
// POST /admin/faculty/delete-image/:id
// =========================================================

router.post(
    '/delete-image/:id',
    async (req, res) => {

        try {

            // ---------------------------------------------
            // ID VALIDATION
            // ---------------------------------------------

            if (
                !isValidId(
                    req.params.id
                )
            ) {

                return res.status(
                    400
                ).json({

                    success: false,

                    message:
                        'Invalid faculty ID'

                });

            }


            // ---------------------------------------------
            // FIND FACULTY
            // ---------------------------------------------

            const faculty =
                await Faculty.findById(
                    req.params.id
                );


            if (
                !faculty
            ) {

                return res.status(
                    404
                ).json({

                    success: false,

                    message:
                        'Faculty not found'

                });

            }


            // ---------------------------------------------
            // STORE IMAGE
            // ---------------------------------------------

            const imagePath =
                faculty.image ||
                '';


            // ---------------------------------------------
            // REMOVE IMAGE FROM DATABASE
            // ---------------------------------------------

            faculty.image =
                '';


            await faculty.save();


            // ---------------------------------------------
            // DELETE FILE
            // ---------------------------------------------

            if (
                imagePath
            ) {

                deleteFacultyImage(
                    imagePath
                );

            }


            return res.json({

                success: true,

                message:
                    'Faculty image deleted successfully.'

            });


        } catch (error) {

            console.error(
                'Delete faculty image error:',
                error
            );


            return res.status(
                500
            ).json({

                success: false,

                message:
                    'Error deleting faculty image.'

            });

        }

    }
);


// =========================================================
// GET FACULTY DETAILS
// GET /admin/faculty/api/:id
// =========================================================

router.get(
    '/api/:id',
    async (req, res) => {

        try {

            // ---------------------------------------------
            // ID VALIDATION
            // ---------------------------------------------

            if (
                !isValidId(
                    req.params.id
                )
            ) {

                return res.status(
                    400
                ).json({

                    success: false,

                    message:
                        'Invalid faculty ID'

                });

            }


            // ---------------------------------------------
            // FIND FACULTY
            // ---------------------------------------------

            const faculty =
                await Faculty.findById(
                    req.params.id
                )
                .lean();


            if (
                !faculty
            ) {

                return res.status(
                    404
                ).json({

                    success: false,

                    message:
                        'Faculty not found'

                });

            }


            return res.json({

                success: true,

                faculty

            });


        } catch (error) {

            console.error(
                'Get faculty details error:',
                error
            );


            return res.status(
                500
            ).json({

                success: false,

                message:
                    'Error loading faculty details.'

            });

        }

    }
);


// =========================================================
// WHATSAPP FACULTY LIST
// GET /admin/faculty/api/whatsapp
// =========================================================

router.get(
    '/api/whatsapp/list',
    async (req, res) => {

        try {

            const faculties =
                await Faculty.find({

                    whatsappNumber: {
                        $exists: true,

                        $ne: ''
                    }

                })
                .select({

                    name: 1,

                    role: 1,

                    category: 1,

                    section: 1,

                    image: 1,

                    whatsappNumber: 1,

                    priority: 1

                })
                .sort({

                    priority: 1,

                    name: 1

                })
                .lean();


            return res.json({

                success: true,

                count:
                    faculties.length,

                faculties

            });


        } catch (error) {

            console.error(
                'WhatsApp faculty list error:',
                error
            );


            return res.status(
                500
            ).json({

                success: false,

                message:
                    'Error loading WhatsApp faculty list.'

            });

        }

    }
);
// =========================================================
// EXPORT ROUTER
// =========================================================

module.exports = router;