const express = require('express');
const router = express.Router();

const path = require('path');
const fs = require('fs');
const multer = require('multer');

const AcademicRecord =
    require('../../models/AcademicRecord');

const auth =
    require('../../middleware/auth');


// =========================================================
// SPORTS & DANCE MANAGER
// =========================================================


// =========================================================
// IMAGE UPLOAD DIRECTORY
// =========================================================

const uploadDir = path.join(
    __dirname,
    '../../public/uploads/sports-dance'
);


// Create folder automatically if it doesn't exist

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

const storage =
    multer.diskStorage({

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


            const filename =
                'achievement-' +
                Date.now() +
                '-' +
                Math.round(
                    Math.random() * 100000
                ) +
                extension;


            cb(
                null,
                filename
            );

        }

    });


// =========================================================
// IMAGE FILTER
// =========================================================

const fileFilter =
    function (
        req,
        file,
        cb
    ) {

        const allowedTypes = [

            'image/jpeg',

            'image/png',

            'image/webp'

        ];


        if (
            allowedTypes.includes(
                file.mimetype
            )
        ) {

            cb(
                null,
                true
            );

        } else {

            cb(
                new Error(
                    'Only JPG, PNG and WebP images are allowed.'
                )
            );

        }

    };


// =========================================================
// MULTER
// =========================================================

const upload =
    multer({

        storage,

        fileFilter,

        limits: {

            fileSize:
                2 * 1024 * 1024

        }

    });


// =========================================================
// DELETE IMAGE HELPER
// =========================================================

function deleteImage(
    imagePath
) {

    if (!imagePath) {

        return;

    }


    /*
        MongoDB example:

        /uploads/sports-dance/achievement-123.jpg
    */


    const cleanPath =
        imagePath.replace(
           (/^\/+/),
            ''
        );


    const fullPath =
        path.join(
            __dirname,
            '../../public',
            cleanPath
        );


    if (
        fs.existsSync(
            fullPath
        )
    ) {

        try {

            fs.unlinkSync(
                fullPath
            );


            console.log(
                '🗑️ Deleted image:',
                fullPath
            );

        } catch (error) {

            console.error(
                '❌ Error deleting image:',
                error
            );

        }

    }

}


// =========================================================
// LIST
// =========================================================

router.get(
    '/',
    auth,
    async (
        req,
        res
    ) => {

        try {

            const records =
                await AcademicRecord.find({

                    recordType: {

                        $in: [
                            'sports',
                            'dance'
                        ]

                    }

                })
                .sort({

                    year: -1,

                    priority: 1,

                    createdAt: -1

                })
                .lean();


            res.render(
                'admin/sportsDance/index',
                {

                    title:
                        'Sports & Dance Manager',

                    active:
                        'sportsDance',

                    records

                }
            );


        } catch (error) {

            console.error(
                '❌ Error loading Sports & Dance:',
                error
            );


            res.redirect(
                '/admin/dashboard'
            );

        }

    }
);


// =========================================================
// ADD PAGE
// =========================================================

router.get(
    '/add',
    auth,
    (
        req,
        res
    ) => {

        res.render(
            'admin/sportsDance/add',
            {

                title:
                    'Add Sports / Dance Record',

                active:
                    'sportsDance'

            }
        );

    }
);


// =========================================================
// CREATE
// =========================================================

router.post(
    '/add',

    auth,

    upload.single('photo'),

    async (
        req,
        res
    ) => {

        try {

            const {

                studentName,

                recordType,

                year,

                batch,

                category,

                level,

                position,

                competition,

                achievement,

                priority

            } = req.body;


            // -------------------------------------------------
            // VALIDATION
            // -------------------------------------------------

            if (
                !studentName ||
                !recordType ||
                !year ||
                !batch
            ) {


                // If image was uploaded but
                // validation failed, remove it.

                if (req.file) {

                    deleteImage(
                        '/uploads/sports-dance/' +
                        req.file.filename
                    );

                }


                return res.redirect(
                    '/admin/sports-dance/add'
                );

            }


            if (
                recordType !== 'sports' &&
                recordType !== 'dance'
            ) {


                if (req.file) {

                    deleteImage(
                        '/uploads/sports-dance/' +
                        req.file.filename
                    );

                }


                return res.redirect(
                    '/admin/sports-dance/add'
                );

            }


            // -------------------------------------------------
            // PHOTO PATH
            // -------------------------------------------------

            let photo = '';


            if (req.file) {

                photo =
                    '/uploads/sports-dance/' +
                    req.file.filename;

            }


            // -------------------------------------------------
            // CREATE RECORD
            // -------------------------------------------------

            const record =
                new AcademicRecord({

                    studentName:
                        studentName.trim(),


                    recordType,


                    className:
                        recordType,


                    year:
                        year.trim(),


                    batch:
                        batch.trim(),


                    rankType:
                        recordType === 'sports'

                            ? 'Sports Achievement'

                            : 'Dance Achievement',


                    category:
                        category
                            ? category.trim()
                            : '',


                    level:
                        level || undefined,


                    position:
                        position
                            ? position.trim()
                            : '',


                    competition:
                        competition
                            ? competition.trim()
                            : '',


                    achievement:
                        achievement
                            ? achievement.trim()
                            : '',


                    priority:
                        Number(priority) || 0,


                    // ⭐ IMAGE

                    photo

                });


            await record.save();


            console.log(
                '✅ Sports/Dance record created:',
                record._id
            );


            res.redirect(
                '/admin/sports-dance'
            );


        } catch (error) {

            console.error(
                '❌ Error creating Sports/Dance record:',
                error
            );


            // If DB save failed,
            // remove uploaded image.

            if (req.file) {

                deleteImage(
                    '/uploads/sports-dance/' +
                    req.file.filename
                );

            }


            res.redirect(
                '/admin/sports-dance/add'
            );

        }

    }
);


// =========================================================
// EDIT PAGE
// =========================================================

router.get(
    '/edit/:id',

    auth,

    async (
        req,
        res
    ) => {

        try {

            const record =
                await AcademicRecord.findOne({

                    _id:
                        req.params.id,

                    recordType: {

                        $in: [
                            'sports',
                            'dance'
                        ]

                    }

                });


            if (!record) {

                return res.redirect(
                    '/admin/sports-dance'
                );

            }


            res.render(
                'admin/sportsDance/edit',
                {

                    title:
                        'Edit Sports / Dance Record',

                    active:
                        'sportsDance',

                    record

                }
            );


        } catch (error) {

            console.error(
                '❌ Error loading record:',
                error
            );


            res.redirect(
                '/admin/sports-dance'
            );

        }

    }
);


// =========================================================
// UPDATE
// =========================================================

router.post(
    '/edit/:id',

    auth,

    upload.single('photo'),

    async (
        req,
        res
    ) => {

        try {

            const {

                studentName,

                recordType,

                year,

                batch,

                category,

                level,

                position,

                competition,

                achievement,

                priority

            } = req.body;


            // -------------------------------------------------
            // VALIDATION
            // -------------------------------------------------

            if (
                !studentName ||
                !recordType ||
                !year ||
                !batch
            ) {


                if (req.file) {

                    deleteImage(
                        '/uploads/sports-dance/' +
                        req.file.filename
                    );

                }


                return res.redirect(
                    `/admin/sports-dance/edit/${req.params.id}`
                );

            }


            if (
                recordType !== 'sports' &&
                recordType !== 'dance'
            ) {


                if (req.file) {

                    deleteImage(
                        '/uploads/sports-dance/' +
                        req.file.filename
                    );

                }


                return res.redirect(
                    `/admin/sports-dance/edit/${req.params.id}`
                );

            }


            // -------------------------------------------------
            // FIND EXISTING RECORD
            // -------------------------------------------------

            const existingRecord =
                await AcademicRecord.findOne({

                    _id:
                        req.params.id,

                    recordType: {

                        $in: [
                            'sports',
                            'dance'
                        ]

                    }

                });


            if (!existingRecord) {


                if (req.file) {

                    deleteImage(
                        '/uploads/sports-dance/' +
                        req.file.filename
                    );

                }


                return res.redirect(
                    '/admin/sports-dance'
                );

            }


            // -------------------------------------------------
            // UPDATED DATA
            // -------------------------------------------------

            const data = {

                studentName:
                    studentName.trim(),


                recordType,


                className:
                    recordType,


                year:
                    year.trim(),


                batch:
                    batch.trim(),


                rankType:
                    recordType === 'sports'

                        ? 'Sports Achievement'

                        : 'Dance Achievement',


                category:
                    category
                        ? category.trim()
                        : '',


                level:
                    level || undefined,


                position:
                    position
                        ? position.trim()
                        : '',


                competition:
                    competition
                        ? competition.trim()
                        : '',


                achievement:
                    achievement
                        ? achievement.trim()
                        : '',


                priority:
                    Number(priority) || 0

            };


            // -------------------------------------------------
            // NEW PHOTO
            // -------------------------------------------------

            if (req.file) {

                const oldPhoto =
                    existingRecord.photo;


                data.photo =
                    '/uploads/sports-dance/' +
                    req.file.filename;


                /*
                    Save new record first.
                    Then delete old image.
                */

                existingRecord.set(
                    data
                );


                await existingRecord.save();


                if (oldPhoto) {

                    deleteImage(
                        oldPhoto
                    );

                }

            } else {

                /*
                    No new photo uploaded.

                    Keep existing photo.
                */

                data.photo =
                    existingRecord.photo;


                existingRecord.set(
                    data
                );


                await existingRecord.save();

            }


            console.log(
                '✅ Sports/Dance record updated:',
                req.params.id
            );


            res.redirect(
                '/admin/sports-dance'
            );


        } catch (error) {

            console.error(
                '❌ Error updating Sports/Dance:',
                error
            );


            /*
                If a new image was uploaded
                but update failed, remove it.
            */

            if (req.file) {

                deleteImage(
                    '/uploads/sports-dance/' +
                    req.file.filename
                );

            }


            res.redirect(
                `/admin/sports-dance/edit/${req.params.id}`
            );

        }

    }
);


// =========================================================
// DELETE
// =========================================================

router.post(
    '/delete/:id',

    auth,

    async (
        req,
        res
    ) => {

        try {

            const record =
                await AcademicRecord.findOne({

                    _id:
                        req.params.id,

                    recordType: {

                        $in: [
                            'sports',
                            'dance'
                        ]

                    }

                });


            if (!record) {

                return res.redirect(
                    '/admin/sports-dance'
                );

            }


            const photo =
                record.photo;


            await AcademicRecord.findOneAndDelete({

                _id:
                    req.params.id,

                recordType: {

                    $in: [
                        'sports',
                        'dance'
                    ]

                }

            });


            // -------------------------------------------------
            // DELETE ASSOCIATED PHOTO
            // -------------------------------------------------

            if (photo) {

                deleteImage(
                    photo
                );

            }


            console.log(
                '🗑️ Sports/Dance record deleted:',
                req.params.id
            );


            res.redirect(
                '/admin/sports-dance'
            );


        } catch (error) {

            console.error(
                '❌ Error deleting Sports/Dance record:',
                error
            );


            res.redirect(
                '/admin/sports-dance'
            );

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
            error instanceof
            multer.MulterError
        ) {


            if (
                error.code ===
                'LIMIT_FILE_SIZE'
            ) {

                return res.status(
                    400
                ).send(
                    'Image is too large. Maximum allowed size is 2 MB.'
                );

            }


            return res.status(
                400
            ).send(
                'Image upload error: ' +
                error.message
            );

        }


        if (
            error &&
            error.message ===
            'Only JPG, PNG and WebP images are allowed.'
        ) {

            return res.status(
                400
            ).send(
                error.message
            );

        }


        next(
            error
        );

    }
);


// =========================================================
// EXPORT
// =========================================================

module.exports = router;