const express = require('express');
const router = express.Router();

const path = require('path');
const fs = require('fs');

const multer = require('multer');
const mongoose = require('mongoose');

const Event = require('../../models/Event');
const auth = require('../../middleware/auth');


// =========================================================
// CONSTANTS
// =========================================================

const VALID_CATEGORIES = [
    'fun-fiesta',
    'sports',
    'national-celebration',
    'old-memory'
];


// =========================================================
// UPLOAD DIRECTORY
// =========================================================

const uploadDirectory =
    path.join(
        __dirname,
        '../../uploads/events'
    );


// Create folder automatically
if (!fs.existsSync(uploadDirectory)) {

    fs.mkdirSync(
        uploadDirectory,
        {
            recursive: true
        }
    );

}


// =========================================================
// FILE NAME
// =========================================================

function createFileName(file) {

    const extension =
        path.extname(
            file.originalname
        ).toLowerCase();

    const baseName =
        path.basename(
            file.originalname,
            extension
        )
        .replace(
            /[^a-zA-Z0-9-_]/g,
            '-'
        )
        .replace(
            /-+/g,
            '-'
        )
        .slice(0, 50);

    return `${Date.now()}-${Math.round(
        Math.random() * 1e9
    )}-${baseName || 'event'}${extension}`;
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
                uploadDirectory
            );

        },


        filename: function (
            req,
            file,
            cb
        ) {

            cb(
                null,
                createFileName(file)
            );

        }

    });


// =========================================================
// FILE FILTER
// =========================================================

function fileFilter(
    req,
    file,
    cb
) {

    const extension =
        path.extname(
            file.originalname
        ).toLowerCase();


    const imageExtensions = [
        '.jpg',
        '.jpeg',
        '.png',
        '.webp'
    ];


    const videoExtensions = [
        '.mp4',
        '.webm',
        '.mov',
        '.m4v'
    ];


    // -----------------------------------------------------
    // IMAGE
    // -----------------------------------------------------

    if (
        file.fieldname === 'coverImage' ||
        file.fieldname === 'photos'
    ) {

        if (
            file.mimetype.startsWith(
                'image/'
            ) &&
            imageExtensions.includes(
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

    }


    // -----------------------------------------------------
    // VIDEO
    // -----------------------------------------------------

    if (
        file.fieldname === 'videos'
    ) {

        if (
            file.mimetype.startsWith(
                'video/'
            ) &&
            videoExtensions.includes(
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
                'Only MP4, WEBM, MOV and M4V videos are allowed.'
            )
        );

    }


    return cb(
        new Error(
            'Invalid upload field.'
        )
    );

}


// =========================================================
// MULTER
// =========================================================

const upload =
    multer({

        storage,

        fileFilter,

        limits: {

            // Maximum individual file
            fileSize:
                100 * 1024 * 1024,

            // Maximum number of files
            files: 61

        }

    });


// =========================================================
// UPLOAD FIELDS
// =========================================================

const eventUpload =
    upload.fields([

        {
            name:
                'coverImage',

            maxCount:
                1

        },

        {
            name:
                'photos',

            maxCount:
                50

        },

        {
            name:
                'videos',

            maxCount:
                10

        }

    ]);


// =========================================================
// HELPERS
// =========================================================

function isValidObjectId(id) {

    return mongoose.Types.ObjectId.isValid(
        id
    );

}


function cleanString(
    value,
    maxLength = 2000
) {

    return String(
        value || ''
    )
        .trim()
        .slice(
            0,
            maxLength
        );

}


function parsePriority(value) {

    const number =
        Number(value);


    if (
        !Number.isFinite(
            number
        )
    ) {

        return 0;

    }


    return Math.max(
        0,
        Math.min(
            number,
            9999
        )
    );

}


// =========================================================
// FILE PATH
// =========================================================

function getPublicFilePath(
    file
) {

    if (!file) {

        return null;

    }


    return `/uploads/events/${file.filename}`;

}


// =========================================================
// DELETE FILE
// =========================================================

function deleteUploadedFile(
    filePath
) {

    if (!filePath) {

        return;

    }


    try {

        const relativePath =
            filePath.replace(
                /^\/+/,
                ''
            );


        const absolutePath =
            path.join(
                __dirname,
                '../../',
                relativePath
            );


        if (
            fs.existsSync(
                absolutePath
            )
        ) {

            fs.unlinkSync(
                absolutePath
            );

        }

    } catch (error) {

        console.error(
            '❌ File delete error:',
            error
        );

    }

}


// =========================================================
// DELETE MULTIPLE FILES
// =========================================================

function deleteMultipleFiles(
    filePaths
) {

    if (
        !Array.isArray(
            filePaths
        )
    ) {

        return;

    }


    filePaths.forEach(
        filePath => {

            deleteUploadedFile(
                filePath
            );

        }
    );

}


// =========================================================
// GET /admin/events
// =========================================================

router.get(
    '/',
    auth,
    async (
        req,
        res
    ) => {

        try {

            const category =
                cleanString(
                    req.query.category,
                    50
                );


            const search =
                cleanString(
                    req.query.search,
                    100
                );


            const query = {};


            if (
                category &&
                VALID_CATEGORIES.includes(
                    category
                )
            ) {

                query.category =
                    category;

            }


            if (search) {

                query.$or = [

                    {
                        title: {
                            $regex:
                                search,

                            $options:
                                'i'
                        }
                    },

                    {
                        description: {
                            $regex:
                                search,

                            $options:
                                'i'
                        }
                    },

                    {
                        session: {
                            $regex:
                                search,

                            $options:
                                'i'
                        }
                    },

                    {
                        batch: {
                            $regex:
                                search,

                            $options:
                                'i'
                        }
                    }

                ];

            }


            const events =
                await Event.find(
                    query
                )
                .sort({
                    priority: 1,
                    date: -1,
                    createdAt: -1
                })
                .lean();


            const totalEvents =
                await Event.countDocuments();


            const publishedEvents =
                await Event.countDocuments({
                    published: true
                });


            const draftEvents =
                await Event.countDocuments({
                    published: false
                });


            const funFiestaCount =
                await Event.countDocuments({
                    category:
                        'fun-fiesta'
                });


            const sportsCount =
                await Event.countDocuments({
                    category:
                        'sports'
                });


            const nationalCount =
                await Event.countDocuments({
                    category:
                        'national-celebration'
                });


            const oldMemoryCount =
                await Event.countDocuments({
                    category:
                        'old-memory'
                });


            return res.render(
                'admin/events/index',
                {

                    title:
                        'Events Manager',

                    active:
                        'events',

                    events,

                    totalEvents,

                    publishedEvents,

                    draftEvents,

                    funFiestaCount,

                    sportsCount,

                    nationalCount,

                    oldMemoryCount,

                    selectedCategory:
                        category,

                    search,

                    csrfToken:
                        req.csrfToken()

                }
            );


        } catch (error) {

            console.error(
                '❌ Events Manager Error:',
                error
            );


            return res.status(
                500
            ).send(
                'Error loading Events Manager'
            );

        }

    }
);


// =========================================================
// GET /admin/events/add
// =========================================================

router.get(
    '/add',
    auth,
    (
        req,
        res
    ) => {

        return res.render(
            'admin/events/add',
            {

                title:
                    'Add Event',

                active:
                    'events',

                csrfToken:
                    req.csrfToken()

            }
        );

    }
);


// =========================================================
// POST /admin/events/add
// =========================================================

router.post(
    '/add',
    auth,
    (
        req,
        res,
        next
    ) => {

        eventUpload(
            req,
            res,
            function (error) {

                if (error) {

                    console.error(
                        '❌ Event upload error:',
                        error
                    );


                    return res.status(
                        400
                    ).send(
                        error.message
                    );

                }


                next();

            }
        );

    },

    async (
        req,
        res
    ) => {

        const uploadedFiles = [];


        try {

            // =================================================
            // FILES
            // =================================================

            const coverFile =
                req.files &&
                req.files.coverImage &&
                req.files.coverImage[0];


            const photoFiles =
                req.files &&
                req.files.photos
                    ? req.files.photos
                    : [];


            const videoFiles =
                req.files &&
                req.files.videos
                    ? req.files.videos
                    : [];


            if (coverFile) {

                uploadedFiles.push(
                    coverFile
                );

            }


            uploadedFiles.push(
                ...photoFiles
            );


            uploadedFiles.push(
                ...videoFiles
            );


            // =================================================
            // DATA
            // =================================================

            const title =
                cleanString(
                    req.body.title,
                    150
                );


            const category =
                cleanString(
                    req.body.category,
                    50
                );


            const description =
                cleanString(
                    req.body.description,
                    2000
                );


            const session =
                cleanString(
                    req.body.session,
                    30
                );


            const batch =
                cleanString(
                    req.body.batch,
                    100
                );


            const priority =
                parsePriority(
                    req.body.priority
                );


            // =================================================
            // VALIDATION
            // =================================================

            if (
                !title ||
                !description ||
                !req.body.date ||
                !VALID_CATEGORIES.includes(
                    category
                )
            ) {

                deleteMultipleFiles(
                    uploadedFiles.map(
                        file =>
                            getPublicFilePath(
                                file
                            )
                    )
                );


                return res.status(
                    400
                ).send(
                    'Please fill all required event fields.'
                );

            }


            // =================================================
            // DATE
            // =================================================

            const eventDate =
                new Date(
                    req.body.date
                );


            if (
                Number.isNaN(
                    eventDate.getTime()
                )
            ) {

                deleteMultipleFiles(
                    uploadedFiles.map(
                        file =>
                            getPublicFilePath(
                                file
                            )
                    )
                );


                return res.status(
                    400
                ).send(
                    'Invalid event date.'
                );

            }


            // =================================================
            // FUN FIESTA
            // =================================================

            if (
                category ===
                    'fun-fiesta' &&
                (
                    !session ||
                    !batch
                )
            ) {

                deleteMultipleFiles(
                    uploadedFiles.map(
                        file =>
                            getPublicFilePath(
                                file
                            )
                    )
                );


                return res.status(
                    400
                ).send(
                    'Session and batch are required for Fun & Fiesta.'
                );

            }


            // =================================================
            // CREATE EVENT
            // =================================================

            const event =
                new Event({

                    title,

                    category,

                    description,

                    date:
                        eventDate,

                    session,

                    batch,

                    coverImage:
                        getPublicFilePath(
                            coverFile
                        ),

                    photos:
                        photoFiles.map(
                            file =>
                                getPublicFilePath(
                                    file
                                )
                        ),

                    videos:
                        videoFiles.map(
                            file =>
                                getPublicFilePath(
                                    file
                                )
                        ),

                    priority,

                    published:
                        req.body.published ===
                        'true'

                });


            await event.save();


            return res.redirect(
                '/admin/events'
            );


        } catch (error) {

            console.error(
                '❌ Create event error:',
                error
            );


            deleteMultipleFiles(
                uploadedFiles.map(
                    file =>
                        getPublicFilePath(
                            file
                        )
                )
            );


            return res.status(
                500
            ).send(
                'Unable to create event.'
            );

        }

    }
);


// =========================================================
// GET /admin/events/edit/:id
// =========================================================

router.get(
    '/edit/:id',
    auth,
    async (
        req,
        res
    ) => {

        try {

            if (
                !isValidObjectId(
                    req.params.id
                )
            ) {

                return res.redirect(
                    '/admin/events'
                );

            }


            const event =
                await Event.findById(
                    req.params.id
                )
                .lean();


            if (!event) {

                return res.redirect(
                    '/admin/events'
                );

            }


            return res.render(
                'admin/events/edit',
                {

                    title:
                        'Edit Event',

                    active:
                        'events',

                    event,

                    csrfToken:
                        req.csrfToken()

                }
            );


        } catch (error) {

            console.error(
                '❌ Edit event page error:',
                error
            );


            return res.redirect(
                '/admin/events'
            );

        }

    }
);


// =========================================================
// POST /admin/events/edit/:id
// =========================================================

router.post(
    '/edit/:id',
    auth,
    (
        req,
        res,
        next
    ) => {

        eventUpload(
            req,
            res,
            function (error) {

                if (error) {

                    console.error(
                        '❌ Event update upload error:',
                        error
                    );


                    return res.status(
                        400
                    ).send(
                        error.message
                    );

                }


                next();

            }
        );

    },

    async (
        req,
        res
    ) => {

        const uploadedFiles = [];


        try {

            if (
                !isValidObjectId(
                    req.params.id
                )
            ) {

                return res.redirect(
                    '/admin/events'
                );

            }


            const existingEvent =
                await Event.findById(
                    req.params.id
                );


            if (!existingEvent) {

                return res.redirect(
                    '/admin/events'
                );

            }


            // =================================================
            // FILES
            // =================================================

            const coverFile =
                req.files &&
                req.files.coverImage &&
                req.files.coverImage[0];


            const photoFiles =
                req.files &&
                req.files.photos
                    ? req.files.photos
                    : [];


            const videoFiles =
                req.files &&
                req.files.videos
                    ? req.files.videos
                    : [];


            if (coverFile) {

                uploadedFiles.push(
                    coverFile
                );

            }


            uploadedFiles.push(
                ...photoFiles
            );


            uploadedFiles.push(
                ...videoFiles
            );


            // =================================================
            // DATA
            // =================================================

            const title =
                cleanString(
                    req.body.title,
                    150
                );


            const category =
                cleanString(
                    req.body.category,
                    50
                );


            const description =
                cleanString(
                    req.body.description,
                    2000
                );


            const session =
                cleanString(
                    req.body.session,
                    30
                );


            const batch =
                cleanString(
                    req.body.batch,
                    100
                );


            const priority =
                parsePriority(
                    req.body.priority
                );


            // =================================================
            // VALIDATION
            // =================================================

            if (
                !title ||
                !description ||
                !req.body.date ||
                !VALID_CATEGORIES.includes(
                    category
                )
            ) {

                deleteMultipleFiles(
                    uploadedFiles.map(
                        file =>
                            getPublicFilePath(
                                file
                            )
                    )
                );


                return res.status(
                    400
                ).send(
                    'Please fill all required event fields.'
                );

            }


            const eventDate =
                new Date(
                    req.body.date
                );


            if (
                Number.isNaN(
                    eventDate.getTime()
                )
            ) {

                deleteMultipleFiles(
                    uploadedFiles.map(
                        file =>
                            getPublicFilePath(
                                file
                            )
                    )
                );


                return res.status(
                    400
                ).send(
                    'Invalid event date.'
                );

            }


            if (
                category ===
                    'fun-fiesta' &&
                (
                    !session ||
                    !batch
                )
            ) {

                deleteMultipleFiles(
                    uploadedFiles.map(
                        file =>
                            getPublicFilePath(
                                file
                            )
                    )
                );


                return res.status(
                    400
                ).send(
                    'Session and batch are required for Fun & Fiesta.'
                );

            }


            // =================================================
            // EXISTING MEDIA
            // =================================================

            let existingPhotos =
                Array.isArray(
                    existingEvent.photos
                )
                    ? existingEvent.photos
                    : [];


            let existingVideos =
                Array.isArray(
                    existingEvent.videos
                )
                    ? existingEvent.videos
                    : [];


            // -------------------------------------------------
            // Existing media sent from edit page
            // -------------------------------------------------

            const keptPhotos =
                Array.isArray(
                    req.body.existingPhotos
                )
                    ? req.body.existingPhotos
                    : (
                        req.body.existingPhotos
                            ? [req.body.existingPhotos]
                            : existingPhotos
                    );


            const keptVideos =
                Array.isArray(
                    req.body.existingVideos
                )
                    ? req.body.existingVideos
                    : (
                        req.body.existingVideos
                            ? [req.body.existingVideos]
                            : existingVideos
                    );


            // =================================================
            // REMOVE OLD PHOTOS
            // =================================================

            const removedPhotos =
                existingPhotos.filter(
                    oldPhoto =>
                        !keptPhotos.includes(
                            oldPhoto
                        )
                );


            deleteMultipleFiles(
                removedPhotos
            );


            // =================================================
            // REMOVE OLD VIDEOS
            // =================================================

            const removedVideos =
                existingVideos.filter(
                    oldVideo =>
                        !keptVideos.includes(
                            oldVideo
                        )
                );


            deleteMultipleFiles(
                removedVideos
            );


            // =================================================
            // NEW MEDIA
            // =================================================

            const newPhotos =
                photoFiles.map(
                    file =>
                        getPublicFilePath(
                            file
                        )
                );


            const newVideos =
                videoFiles.map(
                    file =>
                        getPublicFilePath(
                            file
                        )
                );


            // =================================================
            // COVER IMAGE
            // =================================================

            let coverImage =
                existingEvent.coverImage;


            if (coverFile) {

                if (
                    existingEvent.coverImage
                ) {

                    deleteUploadedFile(
                        existingEvent.coverImage
                    );

                }


                coverImage =
                    getPublicFilePath(
                        coverFile
                    );

            }


            // =================================================
            // UPDATE
            // =================================================

            existingEvent.title =
                title;


            existingEvent.category =
                category;


            existingEvent.description =
                description;


            existingEvent.date =
                eventDate;


            existingEvent.session =
                session;


            existingEvent.batch =
                batch;


            existingEvent.coverImage =
                coverImage;


            existingEvent.photos = [

                ...keptPhotos,

                ...newPhotos

            ];


            existingEvent.videos = [

                ...keptVideos,

                ...newVideos

            ];


            existingEvent.priority =
                priority;


            existingEvent.published =
                req.body.published ===
                'true';


            await existingEvent.save();


            return res.redirect(
                '/admin/events'
            );


        } catch (error) {

            console.error(
                '❌ Update event error:',
                error
            );


            deleteMultipleFiles(
                uploadedFiles.map(
                    file =>
                        getPublicFilePath(
                            file
                        )
                )
            );


            return res.status(
                500
            ).send(
                'Unable to update event.'
            );

        }

    }
);


// =========================================================
// POST /admin/events/toggle/:id
// =========================================================

router.post(
    '/toggle/:id',
    auth,
    async (
        req,
        res
    ) => {

        try {

            if (
                !isValidObjectId(
                    req.params.id
                )
            ) {

                return res.redirect(
                    '/admin/events'
                );

            }


            const event =
                await Event.findById(
                    req.params.id
                );


            if (!event) {

                return res.redirect(
                    '/admin/events'
                );

            }


            event.published =
                !event.published;


            await event.save();


            return res.redirect(
                '/admin/events'
            );


        } catch (error) {

            console.error(
                '❌ Toggle event error:',
                error
            );


            return res.redirect(
                '/admin/events'
            );

        }

    }
);


// =========================================================
// POST /admin/events/delete/:id
// =========================================================

router.post(
    '/delete/:id',
    auth,
    async (
        req,
        res
    ) => {

        try {

            if (
                !isValidObjectId(
                    req.params.id
                )
            ) {

                return res.redirect(
                    '/admin/events'
                );

            }


            const event =
                await Event.findById(
                    req.params.id
                );


            if (!event) {

                return res.redirect(
                    '/admin/events'
                );

            }


            // =================================================
            // DELETE COVER
            // =================================================

            deleteUploadedFile(
                event.coverImage
            );


            // =================================================
            // DELETE PHOTOS
            // =================================================

            deleteMultipleFiles(
                event.photos
            );


            // =================================================
            // DELETE VIDEOS
            // =================================================

            deleteMultipleFiles(
                event.videos
            );


            // =================================================
            // DELETE DATABASE RECORD
            // =================================================

            await Event.findByIdAndDelete(
                req.params.id
            );


            return res.redirect(
                '/admin/events'
            );


        } catch (error) {

            console.error(
                '❌ Delete event error:',
                error
            );


            return res.redirect(
                '/admin/events'
            );

        }

    }
);


// =========================================================
// MULTER ERROR HANDLER
// =========================================================

router.use(
    function (
        error,
        req,
        res,
        next
    ) {

        if (
            error instanceof
            multer.MulterError
        ) {

            console.error(
                '❌ Multer Error:',
                error
            );


            return res.status(
                400
            ).send(
                `Upload error: ${error.message}`
            );

        }


        if (error) {

            console.error(
                '❌ Event route error:',
                error
            );


            return res.status(
                400
            ).send(
                error.message ||
                'Upload failed.'
            );

        }


        next();

    }
);


// =========================================================
// EXPORT
// =========================================================

module.exports = router;