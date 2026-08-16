const express = require('express');
const router = express.Router();

const multer = require('multer');
const fs = require('fs');
const path = require('path');
const validator = require('validator');

const Admission = require('../models/Admission');
const Enquiry = require('../models/Enquiry');
const Payment = require('../models/Payment');
const SchoolInfo = require('../models/SchoolInfo');


// =========================================================
// PAYMENT CONFIG
// =========================================================
//
// TEMPORARY FEES
//
// Later these can be moved to:
// - FeeStructure model
// - Admin settings
// - Razorpay configuration
//
// =========================================================

const ADMISSION_FEE = 500;
const ENQUIRY_FEE = 100;


// =========================================================
// UPLOAD DIRECTORY
// =========================================================

const uploadDir = path.join(
    __dirname,
    '..',
    'public',
    'uploads'
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
// HELPER FUNCTIONS
// =========================================================


function cleanText(
    value,
    max = 300
) {

    return validator.escape(

        validator.trim(

            String(value || '')
                .slice(0, max)

        )

    );

}


function cleanPhone(value) {

    return String(value || '')
        .replace(/\D/g, '')
        .slice(0, 10);

}


function cleanEmail(value) {

    const email =
        validator.normalizeEmail(
            String(value || '')
        ) || '';

    return email;

}


function isValidName(
    value,
    min = 3,
    max = 70
) {

    return new RegExp(
        `^[A-Za-z\\s.]{${min},${max}}$`
    ).test(value);

}


function safeDeleteFile(filename) {

    if (!filename) {
        return;
    }


    const filePath =
        path.join(
            uploadDir,
            filename
        );


    try {

        if (
            fs.existsSync(
                filePath
            )
        ) {

            fs.unlinkSync(
                filePath
            );

        }

    } catch (err) {

        console.log(
            'File cleanup error:',
            err.message
        );

    }

}


// =========================================================
// MULTER CONFIGURATION
// =========================================================

const allowedExt = [

    '.pdf',
    '.jpg',
    '.jpeg',
    '.png'

];


const allowedMime = [

    'application/pdf',
    'image/jpeg',
    'image/png'

];


const storage =
    multer.diskStorage({

        destination:
            function (
                req,
                file,
                cb
            ) {

                cb(
                    null,
                    uploadDir
                );

            },


        filename:
            function (
                req,
                file,
                cb
            ) {

                const ext =
                    path
                        .extname(
                            file.originalname
                        )
                        .toLowerCase();


                const baseName =
                    path
                        .basename(
                            file.originalname,
                            ext
                        )
                        .replace(
                            /[^a-zA-Z0-9-_]/g,
                            '-'
                        )
                        .slice(
                            0,
                            40
                        );


                cb(

                    null,

                    Date.now() +
                    '-' +
                    baseName +
                    ext

                );

            }

    });


const upload =
    multer({

        storage,

        limits: {

            fileSize:
                2 * 1024 * 1024

        },


        fileFilter:
            function (
                req,
                file,
                cb
            ) {

                const ext =
                    path
                        .extname(
                            file.originalname
                        )
                        .toLowerCase();


                if (

                    !allowedExt.includes(
                        ext
                    )

                    ||

                    !allowedMime.includes(
                        file.mimetype
                    )

                ) {

                    return cb(

                        new Error(
                            'Only PDF, JPG, JPEG and PNG files are allowed'
                        )

                    );

                }


                cb(
                    null,
                    true
                );

            }

    });


// =========================================================
// ADMISSION HOME
// GET /admission
// =========================================================

router.get(
    '/',
    (req, res) => {

        return res.redirect(
            '/admission/process'
        );

    }
);


// =========================================================
// ADMISSION PROCESS
// GET /admission/process
// =========================================================

router.get(
    '/process',
    async (req, res) => {

        try {

            const schoolInfo =
                await SchoolInfo
                    .findOne()
                    .lean();


            return res.render(
                'admission/process',
                {

                    title:
                        'Admission Process',

                    schoolInfo

                }
            );


        } catch (err) {

            console.error(
                'Admission Process Error:',
                err.message
            );


            return res.status(
                500
            ).send(
                'Unable to load admission process.'
            );

        }

    }
);


// =========================================================
// ENQUIRY PAGE
// GET /admission/enquiry
// =========================================================

router.get(
    '/enquiry',
    async (req, res) => {

        try {

            const schoolInfo =
                await SchoolInfo
                    .findOne()
                    .lean();


            return res.render(
                'admission/enquiry',
                {

                    title:
                        'Enquiry Form',

                    schoolInfo,

                    query:
                        req.query,

                    enquiryFee:
                        ENQUIRY_FEE

                }
            );


        } catch (err) {

            console.error(
                'Enquiry Page Error:',
                err.message
            );


            return res.status(
                500
            ).send(
                'Unable to load enquiry form.'
            );

        }

    }
);


// =========================================================
// ENQUIRY SUBMISSION
// POST /admission/enquiry
// =========================================================
//
// Flow:
//
// Enquiry Form
//      ↓
// Validate
//      ↓
// Create Enquiry [PENDING]
//      ↓
// Create Payment [PENDING]
//      ↓
// Link Payment
//      ↓
// Payment Page
//
// Actual gateway verification will be added later.
//
// =========================================================

router.post(
    '/enquiry',
    async (req, res) => {

        try {

            // -------------------------------------------------
            // CLEAN INPUT
            // -------------------------------------------------

            const name =
                cleanText(
                    req.body.name,
                    60
                );


            const phone =
                cleanPhone(
                    req.body.phone
                );


            const email =
                cleanEmail(
                    req.body.email
                );


            const message =
                cleanText(
                    req.body.message,
                    1000
                );


            // -------------------------------------------------
            // VALIDATION
            // -------------------------------------------------

            if (
                !isValidName(
                    name,
                    3,
                    60
                )
            ) {

                return res.redirect(
                    '/admission/enquiry?error=true'
                );

            }


            if (
                !/^[0-9]{10}$/.test(
                    phone
                )
            ) {

                return res.redirect(
                    '/admission/enquiry?error=true'
                );

            }


            if (
                email &&
                !validator.isEmail(
                    email
                )
            ) {

                return res.redirect(
                    '/admission/enquiry?error=true'
                );

            }


            if (
                !message ||
                message.length < 5
            ) {

                return res.redirect(
                    '/admission/enquiry?error=true'
                );

            }


            // -------------------------------------------------
            // CREATE ENQUIRY
            // -------------------------------------------------

            const enquiry =
                await Enquiry.create({

                    name,

                    phone,

                    email,

                    message,

                    paymentStatus:
                        'pending',

                    paymentAmount:
                        ENQUIRY_FEE,

                    paymentMethod:
                        'online',

                    enquiryStatus:
                        'new'

                });


            // -------------------------------------------------
            // CREATE PAYMENT
            // -------------------------------------------------

            try {

                const payment =
                    await Payment.create({

                        type:
                            'enquiry',

                        enquiry:
                            enquiry._id,

                        amount:
                            ENQUIRY_FEE,

                        currency:
                            'INR',

                        method:
                            'online',

                        status:
                            'pending',

                        gateway:
                            'demo',

                        notes:
                            'Enquiry payment awaiting gateway integration.'

                    });


                // -------------------------------------------------
                // LINK PAYMENT
                // -------------------------------------------------

                enquiry.payment =
                    payment._id;


                await enquiry.save();


                // -------------------------------------------------
                // REDIRECT TO PAYMENT PAGE
                // -------------------------------------------------

                return res.redirect(

                    `/admission/payment/${payment._id}`

                );


            } catch (paymentErr) {

                // Payment creation failed.
                // Remove enquiry so incomplete records
                // are not unnecessarily stored.

                await Enquiry.findByIdAndDelete(
                    enquiry._id
                );


                throw paymentErr;

            }


        } catch (err) {

            console.error(
                'Admission Enquiry Error:',
                err.message
            );


            return res.redirect(
                '/admission/enquiry?error=true'
            );

        }

    }
);


// =========================================================
// REGISTRATION PAGE
// GET /admission/registration
// =========================================================

router.get(
    '/registration',
    async (req, res) => {

        try {

            const schoolInfo =
                await SchoolInfo
                    .findOne()
                    .lean();


            return res.render(
                'admission/registration',
                {

                    title:
                        'Registration Form',

                    schoolInfo,

                    query:
                        req.query,

                    admissionFee:
                        ADMISSION_FEE

                }
            );


        } catch (err) {

            console.error(
                'Registration Page Error:',
                err.message
            );


            return res.status(
                500
            ).send(
                'Unable to load registration form.'
            );

        }

    }
);


// =========================================================
// REGISTRATION SUBMISSION
// POST /admission/registration
// =========================================================
//
// Flow:
//
// Registration Form
//      ↓
// Validate
//      ↓
// Upload Document
//      ↓
// Create Admission [PENDING]
//      ↓
// Create Payment [PENDING]
//      ↓
// Link Payment
//      ↓
// Payment Page
//
// =========================================================

router.post(
    '/registration',
    (req, res) => {

        upload.single(
            'document'
        )(
            req,
            res,
            async function (
                uploadErr
            ) {

                // -------------------------------------------------
                // UPLOAD ERROR
                // -------------------------------------------------

                if (uploadErr) {

                    console.log(
                        'Upload Error:',
                        uploadErr.message
                    );


                    return res.redirect(
                        '/admission/registration?error=true'
                    );

                }


                try {

                    // -------------------------------------------------
                    // CLEAN INPUT
                    // -------------------------------------------------

                    const studentName =
                        cleanText(
                            req.body.studentName,
                            70
                        );


                    const className =
                        cleanText(
                            req.body.class,
                            30
                        );


                    const parentName =
                        cleanText(
                            req.body.parentName,
                            70
                        );


                    const phone =
                        cleanPhone(
                            req.body.phone
                        );


                    const email =
                        cleanEmail(
                            req.body.email
                        );


                    const address =
                        cleanText(
                            req.body.address,
                            500
                        );


                    const document =
                        req.file
                            ? req.file.filename
                            : null;


                    // -------------------------------------------------
                    // VALIDATION
                    // -------------------------------------------------

                    if (
                        !isValidName(
                            studentName,
                            3,
                            70
                        )
                    ) {

                        safeDeleteFile(
                            document
                        );


                        return res.redirect(
                            '/admission/registration?error=true'
                        );

                    }


                    if (
                        !className ||
                        className.length > 30
                    ) {

                        safeDeleteFile(
                            document
                        );


                        return res.redirect(
                            '/admission/registration?error=true'
                        );

                    }


                    if (
                        !isValidName(
                            parentName,
                            3,
                            70
                        )
                    ) {

                        safeDeleteFile(
                            document
                        );


                        return res.redirect(
                            '/admission/registration?error=true'
                        );

                    }


                    if (
                        !/^[0-9]{10}$/.test(
                            phone
                        )
                    ) {

                        safeDeleteFile(
                            document
                        );


                        return res.redirect(
                            '/admission/registration?error=true'
                        );

                    }


                    if (
                        email &&
                        !validator.isEmail(
                            email
                        )
                    ) {

                        safeDeleteFile(
                            document
                        );


                        return res.redirect(
                            '/admission/registration?error=true'
                        );

                    }


                    if (
                        !address ||
                        address.length < 5
                    ) {

                        safeDeleteFile(
                            document
                        );


                        return res.redirect(
                            '/admission/registration?error=true'
                        );

                    }


                    // -------------------------------------------------
                    // CREATE PENDING ADMISSION
                    // -------------------------------------------------

                    const admission =
                        await Admission.create({

                            studentName,

                            class:
                                className,

                            parentName,

                            phone,

                            email,

                            address,

                            document,

                            paymentStatus:
                                'pending',

                            paymentAmount:
                                ADMISSION_FEE,

                            paymentMethod:
                                'online',

                            applicationStatus:
                                'pending'

                        });


                    // -------------------------------------------------
                    // CREATE PAYMENT
                    // -------------------------------------------------

                    try {

                        const payment =
                            await Payment.create({

                                type:
                                    'admission',

                                admission:
                                    admission._id,

                                amount:
                                    ADMISSION_FEE,

                                currency:
                                    'INR',

                                method:
                                    'online',

                                status:
                                    'pending',

                                gateway:
                                    'demo',

                                notes:
                                    'Admission payment awaiting gateway integration.'

                            });


                        // -------------------------------------------------
                        // LINK PAYMENT TO ADMISSION
                        // -------------------------------------------------

                        admission.payment =
                            payment._id;


                        await admission.save();


                        // -------------------------------------------------
                        // REDIRECT TO PAYMENT PAGE
                        // -------------------------------------------------

                        return res.redirect(

                            `/admission/payment/${payment._id}`

                        );


                    } catch (paymentErr) {

                        // -------------------------------------------------
                        // CLEANUP
                        // -------------------------------------------------

                        await Admission.findByIdAndDelete(
                            admission._id
                        );


                        safeDeleteFile(
                            document
                        );


                        throw paymentErr;

                    }


                } catch (err) {

                    console.error(
                        'Admission Error:',
                        err.message
                    );


                    return res.redirect(
                        '/admission/registration?error=true'
                    );

                }

            }
        );

    }
);


// =========================================================
// PAYMENT PAGE
// GET /admission/payment/:paymentId
// =========================================================
//
// IMPORTANT:
//
// This is currently the gateway-ready payment page.
//
// No fake successful payment is generated here.
//
// Later Razorpay integration will:
// 1. Create gateway order
// 2. Open checkout
// 3. Verify signature server-side
// 4. Mark payment as paid
// 5. Update Admission / Enquiry
//
// =========================================================

router.get(
    '/payment/:paymentId',
    async (req, res) => {

        try {

            const payment =
                await Payment
                    .findById(
                        req.params.paymentId
                    )
                    .populate(
                        'admission'
                    )
                    .populate(
                        'enquiry'
                    )
                    .lean();


            // -------------------------------------------------
            // PAYMENT NOT FOUND
            // -------------------------------------------------

            if (!payment) {

                return res.status(
                    404
                ).send(
                    'Payment not found.'
                );

            }


            // -------------------------------------------------
            // ALREADY PAID
            // -------------------------------------------------

            if (
                payment.status ===
                'paid'
            ) {

                return res.render(
                    'admission/payment-success',
                    {

                        title:
                            'Payment Successful',

                        payment

                    }
                );

            }


            // -------------------------------------------------
            // CANCELLED
            // -------------------------------------------------

            if (
                payment.status ===
                'cancelled'
            ) {

                if (
                    payment.type ===
                    'admission'
                ) {

                    return res.redirect(
                        '/admission/registration?payment=cancelled'
                    );

                }


                return res.redirect(
                    '/admission/enquiry?payment=cancelled'
                );

            }


            // -------------------------------------------------
            // FAILED
            // -------------------------------------------------

            if (
                payment.status ===
                'failed'
            ) {

                if (
                    payment.type ===
                    'admission'
                ) {

                    return res.redirect(
                        '/admission/registration?payment=failed'
                    );

                }


                return res.redirect(
                    '/admission/enquiry?payment=failed'
                );

            }


            // -------------------------------------------------
            // SCHOOL INFO
            // -------------------------------------------------

            const schoolInfo =
                await SchoolInfo
                    .findOne()
                    .lean();


            // -------------------------------------------------
            // RENDER PAYMENT PAGE
            // -------------------------------------------------

            return res.render(
                'admission/payment',
                {

                    title:
                        'Complete Payment',

                    schoolInfo,

                    payment,

                    admission:
                        payment.admission,

                    enquiry:
                        payment.enquiry

                }
            );


        } catch (err) {

            console.error(
                'Payment Page Error:',
                err.message
            );


            return res.status(
                500
            ).send(
                'Unable to load payment page.'
            );

        }

    }
);


// =========================================================
// PAYMENT CANCEL
// GET /admission/payment/:paymentId/cancel
// =========================================================
//
// This DOES NOT mean a gateway refund.
//
// It only cancels a still-pending local payment.
//
// =========================================================

router.get(
    '/payment/:paymentId/cancel',
    async (req, res) => {

        try {

            const payment =
                await Payment.findById(
                    req.params.paymentId
                );


            // -------------------------------------------------
            // PAYMENT NOT FOUND
            // -------------------------------------------------

            if (!payment) {

                return res.redirect(
                    '/admission/process'
                );

            }


            // -------------------------------------------------
            // ONLY PENDING PAYMENTS CAN BE CANCELLED
            // -------------------------------------------------

            if (
                payment.status ===
                'pending'
            ) {

                payment.status =
                    'cancelled';


                payment.notes =
                    payment.notes
                    ? `${payment.notes} Payment cancelled by applicant.`
                    : 'Payment cancelled by applicant.';


                await payment.save();


                // -------------------------------------------------
                // UPDATE ADMISSION
                // -------------------------------------------------

                if (

                    payment.type ===
                    'admission'

                    &&

                    payment.admission

                ) {

                    await Admission.findByIdAndUpdate(

                        payment.admission,

                        {

                            paymentStatus:
                                'cancelled'

                        }

                    );

                }


                // -------------------------------------------------
                // UPDATE ENQUIRY
                // -------------------------------------------------

                if (

                    payment.type ===
                    'enquiry'

                    &&

                    payment.enquiry

                ) {

                    await Enquiry.findByIdAndUpdate(

                        payment.enquiry,

                        {

                            paymentStatus:
                                'cancelled'

                        }

                    );

                }

            }


            // -------------------------------------------------
            // REDIRECT
            // -------------------------------------------------

            if (
                payment.type ===
                'admission'
            ) {

                return res.redirect(
                    '/admission/registration?payment=cancelled'
                );

            }


            return res.redirect(
                '/admission/enquiry?payment=cancelled'
            );


        } catch (err) {

            console.error(
                'Payment Cancel Error:',
                err.message
            );


            return res.redirect(
                '/admission/process'
            );

        }

    }
);


// =========================================================
// GUIDELINES
// GET /admission/guidelines
// =========================================================

router.get(
    '/guidelines',
    async (req, res) => {

        try {

            const schoolInfo =
                await SchoolInfo
                    .findOne()
                    .lean();


            return res.render(
                'admission/guidelines',
                {

                    title:
                        'Guidelines & Policies',

                    schoolInfo

                }
            );


        } catch (err) {

            console.error(
                'Guidelines Error:',
                err.message
            );


            return res.status(
                500
            ).send(
                'Unable to load guidelines.'
            );

        }

    }
);


// =========================================================
// SCHOOL MAP
// GET /admission/map
// =========================================================

router.get(
    '/map',
    async (req, res) => {

        try {

            const schoolInfo =
                await SchoolInfo
                    .findOne()
                    .lean();


            return res.render(
                'admission/map',
                {

                    title:
                        'School Map',

                    schoolInfo

                }
            );


        } catch (err) {

            console.error(
                'School Map Error:',
                err.message
            );


            return res.status(
                500
            ).send(
                'Unable to load school map.'
            );

        }

    }
);


// =========================================================
// EXPORT
// =========================================================

module.exports =
    router;