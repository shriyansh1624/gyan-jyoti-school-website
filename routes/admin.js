const express = require('express');
const router = express.Router();

const validator = require('validator');
const mongoose = require('mongoose');
const csrf = require('csurf');

const Contact = require('../models/Contact');
const Admin = require('../models/Admin');
const Enquiry = require('../models/Enquiry');
const Admission = require('../models/Admission');
const Event = require('../models/Event');
const FeeStructure = require('../models/FeeStructure');

const auth = require('../middleware/auth');


// =========================================================
// HELPERS
// =========================================================

function cleanText(value, max = 200) {

    return validator.escape(
        validator.trim(
            String(value || '').slice(0, max)
        )
    );

}


function cleanPhone(value) {

    return String(value || '')
        .replace(/\D/g, '')
        .slice(0, 10);

}


function isValidId(id) {

    return mongoose.Types.ObjectId.isValid(id);

}


function safeRegex(value) {

    return String(value || '')
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

}


// =========================================================
// CSRF PROTECTION
// =========================================================

const csrfProtection = csrf({
    cookie: false
});


router.use(csrfProtection);


// =========================================================
// GLOBAL CSRF TOKEN
// =========================================================

router.use(
    (req, res, next) => {

        try {

            res.locals.csrfToken =
                req.csrfToken();

            next();

        } catch (error) {

            console.error(
                'CSRF token generation error:',
                error
            );

            next(error);

        }

    }
);


// =========================================================
// ADMIN LOGIN PAGE
// =========================================================
// GET /admin/login
// =========================================================

router.get(
    '/login',
    (req, res) => {

        try {

            if (
                req.session &&
                req.session.admin &&
                req.session.admin.id
            ) {

                return res.redirect(
                    '/admin/dashboard'
                );

            }


            return res.render(
                'admin/login',
                {

                    title:
                        'Admin Login - Gyan Jyoti School',

                    csrfToken:
                        req.csrfToken()

                }
            );


        } catch (error) {

            console.error(
                'Admin login page error:',
                error
            );


            return res.status(500).send(
                'Unable to load admin login page'
            );

        }

    }
);


// =========================================================
// ADMIN LOGIN
// =========================================================
// POST /admin/login
// =========================================================

router.post(
    '/login',
    async (req, res) => {

        try {

            const email =
                String(
                    req.body.email || ''
                )
                    .trim()
                    .toLowerCase();


            const password =
                String(
                    req.body.password || ''
                );


            // =================================================
            // VALIDATION
            // =================================================

            if (
                !email ||
                !password
            ) {

                return res.status(400).render(
                    'admin/login',
                    {

                        title:
                            'Admin Login - Gyan Jyoti School',

                        error:
                            'Email and password are required.',

                        csrfToken:
                            req.csrfToken()

                    }
                );

            }


            if (
                !validator.isEmail(email)
            ) {

                return res.status(400).render(
                    'admin/login',
                    {

                        title:
                            'Admin Login - Gyan Jyoti School',

                        error:
                            'Please enter a valid email address.',

                        csrfToken:
                            req.csrfToken()

                    }
                );

            }


            // =================================================
            // FIND ADMIN
            // =================================================

            const admin =
                await Admin.findOne({
                    email
                });


            // =================================================
            // PASSWORD CHECK
            // =================================================

            if (
                !admin ||
                typeof admin.comparePassword !==
                    'function' ||
                !(await admin.comparePassword(password))
            ) {

                return res.status(401).render(
                    'admin/login',
                    {

                        title:
                            'Admin Login - Gyan Jyoti School',

                        error:
                            'Invalid email or password.',

                        csrfToken:
                            req.csrfToken()

                    }
                );

            }


            // =================================================
            // SESSION FIXATION PROTECTION
            // =================================================

            return req.session.regenerate(
                (sessionError) => {

                    if (sessionError) {

                        console.error(
                            'Session regeneration error:',
                            sessionError
                        );


                        return res.status(500).render(
                            'admin/login',
                            {

                                title:
                                    'Admin Login - Gyan Jyoti School',

                                error:
                                    'Unable to create login session.',

                                csrfToken:
                                    req.csrfToken()

                            }
                        );

                    }


                    // =================================================
                    // STORE ADMIN SESSION
                    // =================================================

                    req.session.admin = {

                        id:
                            admin._id.toString(),

                        name:
                            String(
                                admin.name ||
                                'Admin'
                            ),

                        email:
                            String(
                                admin.email ||
                                email
                            ),

                        role:
                            String(
                                admin.role ||
                                'admin'
                            )

                    };


                    // =================================================
                    // SAVE SESSION
                    // =================================================

                    return req.session.save(
                        (saveError) => {

                            if (saveError) {

                                console.error(
                                    'Session save error:',
                                    saveError
                                );


                                return res.status(500).render(
                                    'admin/login',
                                    {

                                        title:
                                            'Admin Login - Gyan Jyoti School',

                                        error:
                                            'Unable to save login session.',

                                        csrfToken:
                                            req.csrfToken()

                                    }
                                );

                            }


                            return res.redirect(
                                '/admin/dashboard'
                            );

                        }
                    );

                }
            );


        } catch (error) {

            console.error(
                'Admin login error:',
                error
            );


            return res.status(500).render(
                'admin/login',
                {

                    title:
                        'Admin Login - Gyan Jyoti School',

                    error:
                        'Something went wrong. Please try again.',

                    csrfToken:
                        req.csrfToken()

                }
            );

        }

    }
);


// =========================================================
// ADMIN DASHBOARD
// =========================================================
// GET /admin/dashboard
// =========================================================

router.get(
    '/dashboard',
    auth,
    async (req, res) => {

        try {

            // =================================================
            // ADMIN NAME
            // =================================================

            const adminName =
                req.session &&
                req.session.admin &&
                req.session.admin.name
                    ? req.session.admin.name
                    : 'Administrator';


            // =================================================
            // SEARCH
            // =================================================

            const keyword =
                String(
                    req.query.keyword || ''
                ).trim();


            const searchValue =
                safeRegex(keyword);


            // =================================================
            // CONTACT SEARCH
            // =================================================

            const contactQuery =
                keyword
                    ? {

                        $or: [

                            {
                                name: {
                                    $regex: searchValue,
                                    $options: 'i'
                                }
                            },

                            {
                                email: {
                                    $regex: searchValue,
                                    $options: 'i'
                                }
                            },

                            {
                                phone: {
                                    $regex: searchValue,
                                    $options: 'i'
                                }
                            },

                            {
                                subject: {
                                    $regex: searchValue,
                                    $options: 'i'
                                }
                            }

                        ]

                    }
                    : {};


            // =================================================
            // ENQUIRY SEARCH
            // =================================================

            const enquiryQuery =
                keyword
                    ? {

                        $or: [

                            {
                                name: {
                                    $regex: searchValue,
                                    $options: 'i'
                                }
                            },

                            {
                                email: {
                                    $regex: searchValue,
                                    $options: 'i'
                                }
                            },

                            {
                                phone: {
                                    $regex: searchValue,
                                    $options: 'i'
                                }
                            },

                            {
                                message: {
                                    $regex: searchValue,
                                    $options: 'i'
                                }
                            }

                        ]

                    }
                    : {};


            // =================================================
            // ADMISSION SEARCH
            // =================================================

            const admissionQuery =
                keyword
                    ? {

                        $or: [

                            {
                                studentName: {
                                    $regex: searchValue,
                                    $options: 'i'
                                }
                            },

                            {
                                parentName: {
                                    $regex: searchValue,
                                    $options: 'i'
                                }
                            },

                            {
                                phone: {
                                    $regex: searchValue,
                                    $options: 'i'
                                }
                            },

                            {
                                email: {
                                    $regex: searchValue,
                                    $options: 'i'
                                }
                            },

                            {
                                class: {
                                    $regex: searchValue,
                                    $options: 'i'
                                }
                            }

                        ]

                    }
                    : {};


            // =================================================
            // FILTERED RECORDS
            // =================================================

            const contacts =
                await Contact
                    .find(contactQuery)
                    .sort({
                        createdAt: -1
                    })
                    .lean();


            const enquiries =
                await Enquiry
                    .find(enquiryQuery)
                    .sort({
                        createdAt: -1
                    })
                    .lean();


            const admissions =
                await Admission
                    .find(admissionQuery)
                    .sort({
                        createdAt: -1
                    })
                    .lean();


            // =================================================
            // ALL RECORDS
            // =================================================

            const allContacts =
                await Contact
                    .find()
                    .lean();


            const allEnquiries =
                await Enquiry
                    .find()
                    .lean();


            const allAdmissions =
                await Admission
                    .find()
                    .lean();


            // =================================================
            // COUNTS
            // =================================================

            const contactCount =
                allContacts.length;


            const enquiryCount =
                allEnquiries.length;


            const admissionCount =
                allAdmissions.length;


            const totalCount =
                contactCount +
                enquiryCount +
                admissionCount;


            const notificationCount =
                contacts.length +
                enquiries.length +
                admissions.length;


            // =================================================
            // EVENTS STATISTICS
            // =================================================

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
                    category: 'fun-fiesta'
                });


            const sportsCount =
                await Event.countDocuments({
                    category: 'sports'
                });


            // =================================================
            // NATIONAL DAYS
            // =================================================
            // Current system supports both old and new category
            // structures.

            const nationalCount =
                await Event.countDocuments({
                    category: {
                        $in: [
                            'national-celebration',
                            'republic-day',
                            'independence-day'
                        ]
                    }
                });


            const oldMemoryCount =
                await Event.countDocuments({
                    category: 'old-memory'
                });


            // =================================================
            // FEES STATISTICS
            // =================================================

            const totalFeeStructures =
                await FeeStructure.countDocuments();


            const publishedFeeStructures =
                await FeeStructure.countDocuments({
                    published: true
                });


            const hiddenFeeStructures =
                await FeeStructure.countDocuments({
                    published: false
                });


            const feeSessions =
                await FeeStructure.distinct(
                    'session'
                );


            // =================================================
            // MONTHLY STATISTICS
            // =================================================

            const monthMap = {};


            function monthKey(date) {

                const d =
                    new Date(date);


                return d.toLocaleString(
                    'en-IN',
                    {
                        month: 'short',
                        year: '2-digit'
                    }
                );

            }


            // =================================================
            // ADMISSION MONTHLY DATA
            // =================================================

            allAdmissions.forEach(
                (admission) => {

                    const key =
                        monthKey(
                            admission.createdAt
                        );


                    if (!monthMap[key]) {

                        monthMap[key] = {

                            admissions: 0,

                            enquiries: 0

                        };

                    }


                    monthMap[key]
                        .admissions++;

                }
            );


            // =================================================
            // ENQUIRY MONTHLY DATA
            // =================================================

            allEnquiries.forEach(
                (enquiry) => {

                    const key =
                        monthKey(
                            enquiry.createdAt
                        );


                    if (!monthMap[key]) {

                        monthMap[key] = {

                            admissions: 0,

                            enquiries: 0

                        };

                    }


                    monthMap[key]
                        .enquiries++;

                }
            );


            // =================================================
            // LAST 6 MONTHS
            // =================================================

            const now =
                new Date();


            const monthlyStats = [];


            for (
                let i = 5;
                i >= 0;
                i--
            ) {

                const date =
                    new Date(
                        now.getFullYear(),
                        now.getMonth() - i,
                        1
                    );


                const key =
                    date.toLocaleString(
                        'en-IN',
                        {
                            month: 'short',
                            year: '2-digit'
                        }
                    );


                monthlyStats.push({

                    month:
                        key,

                    admissions:
                        monthMap[key]
                            ? monthMap[key].admissions
                            : 0,

                    enquiries:
                        monthMap[key]
                            ? monthMap[key].enquiries
                            : 0

                });

            }


            // =================================================
            // RECENT CONTACTS
            // =================================================

            const recentContacts =
                await Contact
                    .find()
                    .sort({
                        createdAt: -1
                    })
                    .limit(5)
                    .lean();


            // =================================================
            // RECENT ENQUIRIES
            // =================================================

            const recentEnquiries =
                await Enquiry
                    .find()
                    .sort({
                        createdAt: -1
                    })
                    .limit(5)
                    .lean();


            // =================================================
            // RECENT ADMISSIONS
            // =================================================

            const recentAdmissions =
                await Admission
                    .find()
                    .sort({
                        createdAt: -1
                    })
                    .limit(5)
                    .lean();


            // =================================================
            // RENDER DASHBOARD
            // =================================================

            return res.render(
                'admin/dashboard',
                {

                    title:
                        'Admin Dashboard - Gyan Jyoti School',

                    active:
                        'dashboard',

                    keyword,

                    // ADMIN
                    adminName,


                    // COUNTS
                    contactCount,

                    enquiryCount,

                    admissionCount,

                    totalCount,

                    notificationCount,


                    // RECORDS
                    contacts,

                    enquiries,

                    admissions,


                    // RECENT RECORDS
                    recentContacts,

                    recentEnquiries,

                    recentAdmissions,


                    // CHART DATA
                    monthlyStats,


                    // EVENTS
                    totalEvents,

                    publishedEvents,

                    draftEvents,

                    funFiestaCount,

                    sportsCount,

                    nationalCount,

                    oldMemoryCount,


                    // FEES
                    totalFeeStructures,

                    publishedFeeStructures,

                    hiddenFeeStructures,

                    feeSessions

                }
            );


        } catch (error) {

            console.error(
                'Dashboard error:',
                error
            );


            return res.status(500).send(
                'Error loading dashboard'
            );

        }

    }
);


// =========================================================
// EDIT ADMISSION
// GET /admin/admission/edit/:id
// =========================================================

router.get(
    '/admission/edit/:id',
    auth,
    async (req, res) => {

        try {

            if (
                !isValidId(
                    req.params.id
                )
            ) {

                return res.redirect(
                    '/admin/dashboard#admissions'
                );

            }


            const admission =
                await Admission
                    .findById(
                        req.params.id
                    )
                    .lean();


            if (!admission) {

                return res.status(404).send(
                    'Admission not found'
                );

            }


            return res.render(
                'admin/admission-edit',
                {

                    title:
                        'Edit Admission - Admin',

                    admission

                }
            );


        } catch (error) {

            console.error(
                'Edit admission page error:',
                error
            );


            return res.status(500).send(
                'Error loading admission'
            );

        }

    }
);


// =========================================================
// UPDATE ADMISSION
// POST /admin/admission/edit/:id
// =========================================================

router.post(
    '/admission/edit/:id',
    auth,
    async (req, res) => {

        try {

            if (
                !isValidId(
                    req.params.id
                )
            ) {

                return res.redirect(
                    '/admin/dashboard#admissions'
                );

            }


            const studentName =
                cleanText(
                    req.body.studentName,
                    60
                );


            const className =
                cleanText(
                    req.body.class,
                    20
                );


            const parentName =
                cleanText(
                    req.body.parentName,
                    60
                );


            const phone =
                cleanPhone(
                    req.body.phone
                );


            const email =
                validator.normalizeEmail(
                    String(
                        req.body.email || ''
                    )
                );


            const address =
                cleanText(
                    req.body.address,
                    300
                );


            // =================================================
            // VALIDATION
            // =================================================

            if (
                !/^[A-Za-z\s.]{3,60}$/.test(
                    studentName
                )
            ) {

                return res.redirect(
                    '/admin/dashboard#admissions'
                );

            }


            if (
                !/^[A-Za-z\s.]{3,60}$/.test(
                    parentName
                )
            ) {

                return res.redirect(
                    '/admin/dashboard#admissions'
                );

            }


            if (
                !/^[0-9]{10}$/.test(
                    phone
                )
            ) {

                return res.redirect(
                    '/admin/dashboard#admissions'
                );

            }


            // =================================================
            // UPDATE
            // =================================================

            const updatedAdmission =
                await Admission.findByIdAndUpdate(

                    req.params.id,

                    {

                        studentName,

                        class:
                            className,

                        parentName,

                        phone,

                        email,

                        address

                    },

                    {

                        new: true,

                        runValidators: true

                    }

                );


            if (!updatedAdmission) {

                return res.status(404).send(
                    'Admission not found'
                );

            }


            return res.redirect(
                '/admin/dashboard#admissions'
            );


        } catch (error) {

            console.error(
                'Update admission error:',
                error
            );


            return res.status(500).send(
                'Error updating admission'
            );

        }

    }
);


// =========================================================
// DELETE ADMISSION
// =========================================================

router.get(
    '/admission/delete/:id',
    auth,
    async (req, res) => {

        try {

            if (
                !isValidId(
                    req.params.id
                )
            ) {

                return res.redirect(
                    '/admin/dashboard#admissions'
                );

            }


            await Admission.findByIdAndDelete(
                req.params.id
            );


            return res.redirect(
                '/admin/dashboard#admissions'
            );


        } catch (error) {

            console.error(
                'Delete admission error:',
                error
            );


            return res.status(500).send(
                'Error deleting admission'
            );

        }

    }
);


// =========================================================
// EDIT ENQUIRY
// =========================================================

router.get(
    '/enquiry/edit/:id',
    auth,
    async (req, res) => {

        try {

            if (
                !isValidId(
                    req.params.id
                )
            ) {

                return res.redirect(
                    '/admin/dashboard#enquiries'
                );

            }


            const enquiry =
                await Enquiry
                    .findById(
                        req.params.id
                    )
                    .lean();


            if (!enquiry) {

                return res.status(404).send(
                    'Enquiry not found'
                );

            }


            return res.render(
                'admin/enquiry-edit',
                {

                    title:
                        'Edit Enquiry - Admin',

                    enquiry

                }
            );


        } catch (error) {

            console.error(
                'Edit enquiry page error:',
                error
            );


            return res.status(500).send(
                'Error loading enquiry'
            );

        }

    }
);


// =========================================================
// UPDATE ENQUIRY
// =========================================================

router.post(
    '/enquiry/edit/:id',
    auth,
    async (req, res) => {

        try {

            if (
                !isValidId(
                    req.params.id
                )
            ) {

                return res.redirect(
                    '/admin/dashboard#enquiries'
                );

            }


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
                validator.normalizeEmail(
                    String(
                        req.body.email || ''
                    )
                );


            const message =
                cleanText(
                    req.body.message,
                    500
                );


            // =================================================
            // VALIDATION
            // =================================================

            if (
                !/^[A-Za-z\s.]{3,60}$/.test(
                    name
                )
            ) {

                return res.redirect(
                    '/admin/dashboard#enquiries'
                );

            }


            if (
                !/^[0-9]{10}$/.test(
                    phone
                )
            ) {

                return res.redirect(
                    '/admin/dashboard#enquiries'
                );

            }


            // =================================================
            // UPDATE
            // =================================================

            const updatedEnquiry =
                await Enquiry.findByIdAndUpdate(

                    req.params.id,

                    {

                        name,

                        phone,

                        email,

                        message

                    },

                    {

                        new: true,

                        runValidators: true

                    }

                );


            if (!updatedEnquiry) {

                return res.status(404).send(
                    'Enquiry not found'
                );

            }


            return res.redirect(
                '/admin/dashboard#enquiries'
            );


        } catch (error) {

            console.error(
                'Update enquiry error:',
                error
            );


            return res.status(500).send(
                'Error updating enquiry'
            );

        }

    }
);


// =========================================================
// DELETE ENQUIRY
// =========================================================

router.get(
    '/enquiry/delete/:id',
    auth,
    async (req, res) => {

        try {

            if (
                !isValidId(
                    req.params.id
                )
            ) {

                return res.redirect(
                    '/admin/dashboard#enquiries'
                );

            }


            await Enquiry.findByIdAndDelete(
                req.params.id
            );


            return res.redirect(
                '/admin/dashboard#enquiries'
            );


        } catch (error) {

            console.error(
                'Delete enquiry error:',
                error
            );


            return res.status(500).send(
                'Error deleting enquiry'
            );

        }

    }
);


// =========================================================
// DELETE CONTACT
// =========================================================

router.get(
    '/contact/delete/:id',
    auth,
    async (req, res) => {

        try {

            if (
                !isValidId(
                    req.params.id
                )
            ) {

                return res.redirect(
                    '/admin/dashboard#contacts'
                );

            }


            await Contact.findByIdAndDelete(
                req.params.id
            );


            return res.redirect(
                '/admin/dashboard#contacts'
            );


        } catch (error) {

            console.error(
                'Delete contact error:',
                error
            );


            return res.status(500).send(
                'Error deleting contact'
            );

        }

    }
);


// =========================================================
// LOGOUT
// =========================================================

router.get(
    '/logout',
    (req, res) => {

        req.session.destroy(
            (error) => {

                if (error) {

                    console.error(
                        'Logout error:',
                        error
                    );

                }


                return res.redirect(
                    '/'
                );

            }
        );

    }
);


// =========================================================
// CSRF ERROR HANDLER
// =========================================================

router.use(
    (err, req, res, next) => {

        if (
            err &&
            err.code === 'EBADCSRFTOKEN'
        ) {

            console.error(
                '❌ Invalid CSRF token:',
                req.method,
                req.originalUrl
            );


            return res.status(403).render(
                'error',
                {

                    message:
                        'Security token expired. Please refresh the page and try again.',

                    error:
                        process.env.NODE_ENV ===
                        'development'
                            ? err
                            : {}

                }
            );

        }


        return next(err);

    }
);


// =========================================================
// EXPORT
// =========================================================

module.exports = router;