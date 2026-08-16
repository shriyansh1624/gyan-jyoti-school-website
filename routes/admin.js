const express = require('express');
const router = express.Router();

const validator = require('validator');
const mongoose = require('mongoose');
const csrf = require('csurf');

const Contact = require('../models/Contact');
const Admin = require('../models/Admin');
const Enquiry = require('../models/Enquiry');
const Admission = require('../models/Admission');
const Payment = require('../models/Payment');
const PrincipalContact = require('../models/PrincipalContact');


const auth = require('../middleware/auth');


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

router.use((req, res, next) => {

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

});


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


function escapeRegex(value) {

    return String(value || '')
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

}


// =========================================================
// ADMIN LOGIN PAGE
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
// =========================================================
// ADMIN LOGIN
// POST /admin/login
// =========================================================

router.post(
    '/login',
    async (req, res) => {

        const renderLogin = (statusCode, error) => {
            return res.status(statusCode).render(
                'admin/login',
                {
                    title: 'Admin Login - Gyan Jyoti School',
                    error: error,
                    csrfToken:
                        typeof req.csrfToken === 'function'
                            ? req.csrfToken()
                            : ''
                }
            );
        };

        try {

            const email =
                validator.normalizeEmail(
                    String(req.body.email || '').trim()
                ) || '';

            const password =
                String(req.body.password || '');

            if (!email || !password) {
                return renderLogin(
                    400,
                    'Email and password are required.'
                );
            }

            if (!validator.isEmail(email)) {
                return renderLogin(
                    400,
                    'Please enter a valid email address.'
                );
            }

            const admin =
                await Admin.findOne({ email });

            if (!admin) {
                console.log(
                    'ADMIN LOGIN FAILED: Admin not found:',
                    email
                );

                return renderLogin(
                    401,
                    'Invalid email or password.'
                );
            }

            // Prefer the Admin model's comparePassword().
            // Fallback to bcryptjs/bcrypt for older Admin models.
            let passwordMatch = false;

            if (
                typeof admin.comparePassword === 'function'
            ) {
                passwordMatch =
                    await admin.comparePassword(password);
            } else {
                let bcrypt = null;

                try {
                    bcrypt = require('bcryptjs');
                } catch (e) {
                    try {
                        bcrypt = require('bcrypt');
                    } catch (e2) {
                        bcrypt = null;
                    }
                }

                if (bcrypt && admin.password) {
                    passwordMatch =
                        await bcrypt.compare(
                            password,
                            admin.password
                        );
                } else {
                    // Legacy plaintext fallback only when the stored
                    // password is actually plaintext.
                    passwordMatch =
                        String(admin.password || '') === password;
                }
            }

            if (!passwordMatch) {
                console.log(
                    'ADMIN LOGIN FAILED: Wrong password for:',
                    email
                );

                return renderLogin(
                    401,
                    'Invalid email or password.'
                );
            }

            // Regenerate the session after authentication.
            if (!req.session) {
                return renderLogin(
                    500,
                    'Login session is unavailable. Restart the server and try again.'
                );
            }

            return req.session.regenerate(
                (sessionError) => {

                    if (sessionError) {
                        console.error(
                            'SESSION REGENERATION ERROR:',
                            sessionError
                        );

                        return renderLogin(
                            500,
                            'Unable to create login session. Please try again.'
                        );
                    }

                    req.session.admin = {
                        id:
                            String(admin._id),

                        name:
                            String(
                                admin.name || 'Admin'
                            ).slice(0, 100),

                        email:
                            String(
                                admin.email || email
                            ).slice(0, 254),

                        role:
                            String(
                                admin.role || 'admin'
                            )
                    };

                    return req.session.save(
                        (saveError) => {

                            if (saveError) {
                                console.error(
                                    'SESSION SAVE ERROR:',
                                    saveError
                                );

                                return renderLogin(
                                    500,
                                    'Unable to save login session. Please try again.'
                                );
                            }

                            console.log(
                                'ADMIN LOGIN SUCCESS:',
                                email
                            );

                            return res.redirect(
                                '/admin/dashboard'
                            );
                        }
                    );
                }
            );

        } catch (error) {

            console.error(
                'ADMIN LOGIN ERROR:',
                error
            );

            return renderLogin(
                500,
                'Server error while logging in. Please try again.'
            );
        }
    }
);


// =========================================================
// ADMIN DASHBOARD + SEARCH
// GET /admin/dashboard
// =========================================================

router.get(
    '/dashboard',
    auth,
    async (req, res) => {

        try {

            const keyword =
                String(
                    req.query.keyword || ''
                ).trim();


            const searchRegex =
                keyword
                    ? escapeRegex(keyword)
                    : '';


            // =================================================
            // CONTACT SEARCH
            // =================================================

            const contactQuery =
                keyword
                    ? {
                        $or: [

                            {
                                name: {
                                    $regex: searchRegex,
                                    $options: 'i'
                                }
                            },

                            {
                                email: {
                                    $regex: searchRegex,
                                    $options: 'i'
                                }
                            },

                            {
                                phone: {
                                    $regex: searchRegex,
                                    $options: 'i'
                                }
                            },

                            {
                                subject: {
                                    $regex: searchRegex,
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
                                    $regex: searchRegex,
                                    $options: 'i'
                                }
                            },

                            {
                                email: {
                                    $regex: searchRegex,
                                    $options: 'i'
                                }
                            },

                            {
                                phone: {
                                    $regex: searchRegex,
                                    $options: 'i'
                                }
                            },

                            {
                                message: {
                                    $regex: searchRegex,
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
                                    $regex: searchRegex,
                                    $options: 'i'
                                }
                            },

                            {
                                parentName: {
                                    $regex: searchRegex,
                                    $options: 'i'
                                }
                            },

                            {
                                phone: {
                                    $regex: searchRegex,
                                    $options: 'i'
                                }
                            },

                            {
                                email: {
                                    $regex: searchRegex,
                                    $options: 'i'
                                }
                            },

                            {
                                class: {
                                    $regex: searchRegex,
                                    $options: 'i'
                                }
                            }

                        ]
                    }
                    : {};


            // =================================================
            // FETCH DATA
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
            // ALL DATA
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
            // PAYMENT STATISTICS
            // =================================================

            const totalPayments =
                await Payment.countDocuments();


            const paidPayments =
                await Payment.countDocuments({
                    status: 'paid'
                });


            const pendingPayments =
                await Payment.countDocuments({
                    status: 'pending'
                });


            const failedPayments =
                await Payment.countDocuments({
                    status: 'failed'
                });


            const cancelledPayments =
                await Payment.countDocuments({
                    status: 'cancelled'
                });


            const refundedPayments =
                await Payment.countDocuments({
                    status: 'refunded'
                });


            const revenueResult =
                await Payment.aggregate([

                    {
                        $match: {
                            status: 'paid'
                        }
                    },

                    {
                        $group: {

                            _id: null,

                            total: {
                                $sum: '$amount'
                            }

                        }
                    }

                ]);


            const totalRevenue =
                revenueResult.length
                    ? revenueResult[0].total
                    : 0;


            // =================================================
            // COUNTS
            // =================================================

            const totalCount =
                allContacts.length +
                allEnquiries.length +
                allAdmissions.length;


            const notificationCount =
                contacts.length +
                enquiries.length +
                admissions.length;


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


            allAdmissions.forEach(
                admission => {

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


                    monthMap[key].admissions++;

                }
            );


            allEnquiries.forEach(
                enquiry => {

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


                    monthMap[key].enquiries++;

                }
            );


            const monthlyLabels =
                Object.keys(monthMap)
                    .slice(-6);


            const monthlyAdmissions =
                monthlyLabels.map(
                    month =>
                        monthMap[month].admissions
                );


            const monthlyEnquiries =
                monthlyLabels.map(
                    month =>
                        monthMap[month].enquiries
                );


            // =================================================
            // RENDER DASHBOARD
            // =================================================

            return res.render(
                'admin/dashboard',
                {

                    contacts,

                    enquiries,

                    admissions,

                    keyword,

                    totalCount,

                    contactCount:
                        allContacts.length,

                    enquiryCount:
                        allEnquiries.length,

                    admissionCount:
                        allAdmissions.length,

                    notificationCount,

                    monthlyLabels,

                    monthlyAdmissions,

                    monthlyEnquiries,

                    totalPayments,

                    paidPayments,

                    pendingPayments,

                    failedPayments,

                    cancelledPayments,

                    refundedPayments,

                    totalRevenue,

                    adminName:
                        req.session.admin.name,

                    title:
                        'Admin Dashboard - Gyan Jyoti School'

                }
            );


        } catch (error) {

            console.error(
                'Dashboard error:',
                error
            );

            return res.status(500).send(
                'Dashboard loading error'
            );

        }

    }
);


// =========================================================
// EDIT ADMISSION PAGE
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

                    admission,

                    csrfToken:
                        req.csrfToken()

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
                    req.body.email || ''
                ) || '';


            const address =
                cleanText(
                    req.body.address,
                    300
                );


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
// EDIT ENQUIRY PAGE
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

                    enquiry,

                    csrfToken:
                        req.csrfToken()

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
                    req.body.email || ''
                ) || '';


            const message =
                cleanText(
                    req.body.message,
                    500
                );


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
// PRINCIPAL CONTACT MANAGEMENT
// Completely isolated from existing /admin/contacts
// =========================================================

// GET /admin/principal-contacts
router.get('/principal-contacts', auth, async (req, res) => {
    try {
        const keyword = String(req.query.search || '').trim();

        const search = keyword
            ? keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            : '';

        const query = keyword
            ? {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } },
                    { subject: { $regex: search, $options: 'i' } },
                    { message: { $regex: search, $options: 'i' } }
                ]
            }
            : {};

        const principalContacts = await PrincipalContact
            .find(query)
            .sort({ createdAt: -1 })
            .lean();

        return res.render('admin/principal-contacts', {
            title: 'Principal Messages - Gyan Jyoti School',
            principalContacts,
            adminName:
                req.session &&
                req.session.admin
                    ? String(
                        req.session.admin.name ||
                        'Administrator'
                    )
                    : 'Administrator'
        });

    } catch (error) {

        console.error(
            'Principal contacts page error:',
            error
        );

        return res
            .status(500)
            .send('Error loading principal messages');
    }
});


// =========================================================
// MARK PRINCIPAL MESSAGE AS READ
// POST /admin/principal-contacts/:id/read
// =========================================================

router.post(
    '/principal-contacts/:id/read',
    auth,
    async (req, res) => {

        try {

            const updated =
                await PrincipalContact.findByIdAndUpdate(
                    req.params.id,
                    {
                        status: 'read',
                        updatedAt: new Date()
                    },
                    {
                        returnDocument: 'after'
                    }
                );

            if (!updated) {
                return res
                    .status(404)
                    .json({
                        success: false,
                        message: 'Principal message not found'
                    });
            }

            return res.json({
                success: true,
                message: 'Message marked as read'
            });

        } catch (error) {

            console.error(
                'Principal message read error:',
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message: 'Unable to update message'
                });
        }
    }
);


// =========================================================
// MARK PRINCIPAL MESSAGE AS RESOLVED
// POST /admin/principal-contacts/:id/resolved
// =========================================================

router.post(
    '/principal-contacts/:id/resolved',
    auth,
    async (req, res) => {

        try {

            const updated =
                await PrincipalContact.findByIdAndUpdate(
                    req.params.id,
                    {
                        status: 'resolved',
                        updatedAt: new Date()
                    },
                    {
                        returnDocument: 'after'
                    }
                );

            if (!updated) {
                return res
                    .status(404)
                    .json({
                        success: false,
                        message: 'Principal message not found'
                    });
            }

            return res.json({
                success: true,
                message: 'Message marked as resolved'
            });

        } catch (error) {

            console.error(
                'Principal message resolve error:',
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message: 'Unable to resolve message'
                });
        }
    }
);

// =========================================================
// PAYMENT MANAGEMENT
// GET /admin/payments
// =========================================================

router.get(
    '/payments',
    auth,
    async (req, res) => {

        try {

            const status =
                String(
                    req.query.status || ''
                ).trim();


            const type =
                String(
                    req.query.type || ''
                ).trim();


            const keyword =
                String(
                    req.query.search || ''
                ).trim();


            const query = {};


            const allowedStatuses = [

                'pending',

                'paid',

                'failed',

                'cancelled',

                'refunded'

            ];


            if (
                status &&
                allowedStatuses.includes(
                    status
                )
            ) {

                query.status = status;

            }


            if (
                type === 'admission' ||
                type === 'enquiry'
            ) {

                query.type = type;

            }


            // =================================================
            // PAYMENT SEARCH
            // =================================================

            if (keyword) {

                const regex =
                    new RegExp(
                        escapeRegex(keyword),
                        'i'
                    );


                const matchingAdmissions =
                    await Admission
                        .find({
                            $or: [

                                {
                                    studentName:
                                        regex
                                },

                                {
                                    parentName:
                                        regex
                                },

                                {
                                    phone:
                                        regex
                                },

                                {
                                    email:
                                        regex
                                }

                            ]
                        })
                        .select('_id')
                        .lean();


                const matchingEnquiries =
                    await Enquiry
                        .find({
                            $or: [

                                {
                                    name:
                                        regex
                                },

                                {
                                    phone:
                                        regex
                                },

                                {
                                    email:
                                        regex
                                },

                                {
                                    message:
                                        regex
                                }

                            ]
                        })
                        .select('_id')
                        .lean();


                query.$or = [

                    {
                        orderId:
                            regex
                    },

                    {
                        transactionId:
                            regex
                    },

                    {
                        admission: {
                            $in:
                                matchingAdmissions.map(
                                    item =>
                                        item._id
                                )
                        }
                    },

                    {
                        enquiry: {
                            $in:
                                matchingEnquiries.map(
                                    item =>
                                        item._id
                                )
                        }
                    }

                ];

            }


            // =================================================
            // FETCH PAYMENTS
            // =================================================

            const payments =
                await Payment
                    .find(query)

                    .populate(
                        'admission',
                        'studentName parentName phone email class'
                    )

                    .populate(
                        'enquiry',
                        'name phone email message'
                    )

                    .sort({
                        createdAt: -1
                    })

                    .lean();


            // =================================================
            // PAYMENT STATS
            // =================================================

            const paymentStats =
                await Payment.aggregate([

                    {
                        $group: {

                            _id:
                                '$status',

                            count: {
                                $sum: 1
                            },

                            amount: {
                                $sum: '$amount'
                            }

                        }
                    }

                ]);


            const stats = {

                total: 0,

                paid: 0,

                pending: 0,

                failed: 0,

                cancelled: 0,

                refunded: 0,

                revenue: 0

            };


            paymentStats.forEach(
                item => {

                    stats.total +=
                        item.count;


                    if (
                        stats[item._id]
                        !== undefined
                    ) {

                        stats[item._id] =
                            item.count;

                    }


                    if (
                        item._id === 'paid'
                    ) {

                        stats.revenue =
                            item.amount;

                    }

                }
            );


            return res.render(
                'admin/payments',
                {

                    title:
                        'Payment Management - Admin',

                    active:
                        'payments',

                    adminName:
                        req.session
                            ?.admin
                            ?.name ||
                        'Administrator',

                    payments,

                    stats,

                    status,

                    type,

                    keyword,

                    csrfToken:
                        req.csrfToken()

                }
            );


        } catch (error) {

            console.error(
                'Payment management error:',
                error
            );

            return res.status(500).send(
                'Error loading payments'
            );

        }

    }
);


// =========================================================
// PAYMENT DETAILS
// GET /admin/payment/:id
// =========================================================

router.get(
    '/payment/:id',
    auth,
    async (req, res) => {

        try {

            if (
                !isValidId(
                    req.params.id
                )
            ) {

                return res.redirect(
                    '/admin/payments'
                );

            }


            const payment =
                await Payment
                    .findById(
                        req.params.id
                    )

                    .populate(
                        'admission',
                        'studentName parentName phone email class address document'
                    )

                    .populate(
                        'enquiry',
                        'name phone email message'
                    )

                    .lean();


            if (!payment) {

                return res.status(404).send(
                    'Payment not found'
                );

            }


            return res.render(
                'admin/payment-details',
                {

                    title:
                        'Payment Details - Admin',

                    active:
                        'payments',

                    adminName:
                        req.session
                            ?.admin
                            ?.name ||
                        'Administrator',

                    payment,

                    csrfToken:
                        req.csrfToken()

                }
            );


        } catch (error) {

            console.error(
                'Payment details error:',
                error
            );

            return res.status(500).send(
                'Error loading payment details'
            );

        }

    }
);


// =========================================================
// UPDATE PAYMENT STATUS
// =========================================================

router.post(
    '/payment/:id/status',
    auth,
    async (req, res) => {

        try {

            if (
                !isValidId(
                    req.params.id
                )
            ) {

                return res.redirect(
                    '/admin/payments'
                );

            }


            const status =
                String(
                    req.body.status || ''
                ).trim();


            const allowedStatuses = [

                'pending',

                'paid',

                'failed',

                'cancelled',

                'refunded'

            ];


            if (
                !allowedStatuses.includes(
                    status
                )
            ) {

                return res.status(400).send(
                    'Invalid payment status'
                );

            }


            const payment =
                await Payment.findById(
                    req.params.id
                );


            if (!payment) {

                return res.status(404).send(
                    'Payment not found'
                );

            }


            // =================================================
            // UPDATE PAYMENT
            // =================================================

            payment.status =
                status;


            if (
                status === 'paid'
            ) {

                payment.paidAt =
                    payment.paidAt ||
                    new Date();

            } else {

                payment.paidAt =
                    null;

            }


            await payment.save();


            // =================================================
            // SYNC ADMISSION
            // =================================================

            if (
                payment.type === 'admission' &&
                payment.admission
            ) {

                await Admission.findByIdAndUpdate(
                    payment.admission,
                    {

                        paymentStatus:
                            status,

                        payment:
                            payment._id,

                        paymentAmount:
                            payment.amount,

                        paymentMethod:
                            payment.method

                    }
                );

            }


            // =================================================
            // SYNC ENQUIRY
            // =================================================

            if (
                payment.type === 'enquiry' &&
                payment.enquiry
            ) {

                await Enquiry.findByIdAndUpdate(
                    payment.enquiry,
                    {

                        paymentStatus:
                            status,

                        payment:
                            payment._id,

                        paymentAmount:
                            payment.amount,

                        paymentMethod:
                            payment.method

                    }
                );

            }


            return res.redirect(
                `/admin/payment/${payment._id}`
            );


        } catch (error) {

            console.error(
                'Update payment status error:',
                error
            );

            return res.status(500).send(
                'Error updating payment status'
            );

        }

    }
);


// =========================================================
// LOGOUT
// GET /admin/logout
// =========================================================

router.get(
    '/logout',
    (req, res) => {

        if (!req.session) {
            return res.redirect('/admin/login');
        }

        req.session.destroy(
            (error) => {

                if (error) {
                    console.error(
                        'Logout error:',
                        error
                    );

                    return res
                        .status(500)
                        .send('Logout failed');
                }

                res.clearCookie(
                    'connect.sid',
                    {
                        httpOnly: true,
                        secure:
                            process.env.COOKIE_SECURE === 'true',
                        sameSite: 'lax'
                    }
                );

                return res.redirect(
                    '/admin/login'
                );
            }
        );
    }
);
// =========================================================
// ADMISSIONS MANAGEMENT PAGE
// GET /admin/admissions
// =========================================================

router.get('/admissions', auth, async (req, res) => {
    try {
        const keyword = String(req.query.search || '').trim();

        const search = keyword
            ? keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            : '';

        const query = keyword
            ? {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { class: { $regex: search, $options: 'i' } }
                ]
            }
            : {};

        const [
            admissions,
            allAdmissions,
            allEnquiries,
            allContacts
        ] = await Promise.all([
            Admission.find(query)
                .sort({ createdAt: -1 })
                .lean(),

            Admission.find()
                .select('_id')
                .lean(),

            Enquiry.find()
                .select('_id')
                .lean(),

            Contact.find()
                .select('_id')
                .lean()
        ]);

        return res.render('admin/admissions', {
            title: 'Admissions - Gyan Jyoti School',

            admissions,

            admissionCount: allAdmissions.length,

            enquiryCount: allEnquiries.length,

            contactCount: allContacts.length,

            adminName:
                req.session &&
                req.session.admin
                    ? String(
                        req.session.admin.name ||
                        'Administrator'
                    )
                    : 'Administrator'
        });

    } catch (error) {
        console.error(
            'Admissions page error:',
            error
        );

        return res
            .status(500)
            .send('Error loading admissions');
    }
});


// =========================================================
// ENQUIRIES MANAGEMENT PAGE
// GET /admin/enquiries
// =========================================================

router.get('/enquiries', auth, async (req, res) => {
    try {
        const keyword =
            String(req.query.search || '').trim();

        const search = keyword
            ? keyword.replace(
                /[.*+?^${}()|[\]\\]/g,
                '\\$&'
            )
            : '';

        const query = keyword
            ? {
                $or: [
                    {
                        name: {
                            $regex: search,
                            $options: 'i'
                        }
                    },
                    {
                        phone: {
                            $regex: search,
                            $options: 'i'
                        }
                    },
                    {
                        email: {
                            $regex: search,
                            $options: 'i'
                        }
                    },
                    {
                        subject: {
                            $regex: search,
                            $options: 'i'
                        }
                    },
                    {
                        message: {
                            $regex: search,
                            $options: 'i'
                        }
                    }
                ]
            }
            : {};

        const [
            enquiries,
            allAdmissions,
            allEnquiries,
            allContacts
        ] = await Promise.all([
            Enquiry.find(query)
                .sort({ createdAt: -1 })
                .lean(),

            Admission.find()
                .select('_id')
                .lean(),

            Enquiry.find()
                .select('_id')
                .lean(),

            Contact.find()
                .select('_id')
                .lean()
        ]);

        return res.render('admin/enquiries', {
            title: 'Enquiries - Gyan Jyoti School',

            enquiries,

            admissionCount: allAdmissions.length,

            enquiryCount: allEnquiries.length,

            contactCount: allContacts.length,

            adminName:
                req.session &&
                req.session.admin
                    ? String(
                        req.session.admin.name ||
                        'Administrator'
                    )
                    : 'Administrator'
        });

    } catch (error) {
        console.error(
            'Enquiries page error:',
            error
        );

        return res
            .status(500)
            .send('Error loading enquiries');
    }
});


// =========================================================
// CONTACT MANAGEMENT PAGE
// GET /admin/contacts
// =========================================================

router.get('/contacts', auth, async (req, res) => {
    try {
        const keyword =
            String(req.query.search || '').trim();

        const search = keyword
            ? keyword.replace(
                /[.*+?^${}()|[\]\\]/g,
                '\\$&'
            )
            : '';

        const query = keyword
            ? {
                $or: [
                    {
                        name: {
                            $regex: search,
                            $options: 'i'
                        }
                    },
                    {
                        email: {
                            $regex: search,
                            $options: 'i'
                        }
                    },
                    {
                        phone: {
                            $regex: search,
                            $options: 'i'
                        }
                    },
                    {
                        category: {
                            $regex: search,
                            $options: 'i'
                        }
                    },
                    {
                        subject: {
                            $regex: search,
                            $options: 'i'
                        }
                    },
                    {
                        message: {
                            $regex: search,
                            $options: 'i'
                        }
                    }
                ]
            }
            : {};

        const [
            contacts,
            allAdmissions,
            allEnquiries,
            allContacts
        ] = await Promise.all([
            Contact.find(query)
                .sort({ createdAt: -1 })
                .lean(),

            Admission.find()
                .select('_id')
                .lean(),

            Enquiry.find()
                .select('_id')
                .lean(),

            Contact.find()
                .select('_id')
                .lean()
        ]);

        return res.render('admin/contacts', {
            title: 'Contacts - Gyan Jyoti School',

            contacts,

            admissionCount: allAdmissions.length,

            enquiryCount: allEnquiries.length,

            contactCount: allContacts.length,

            adminName:
                req.session &&
                req.session.admin
                    ? String(
                        req.session.admin.name ||
                        'Administrator'
                    )
                    : 'Administrator'
        });

    } catch (error) {
        console.error(
            'Contacts page error:',
            error
        );

        return res
            .status(500)
            .send('Error loading contacts');
    }
});
// ============================================================
// ADMIN SETTINGS
// ============================================================

router.get('/settings', auth, async (req, res) => {
    try {
        return res.render('admin/settings', {
            title: 'Admin Settings'
        });

    } catch (error) {
        console.error(
            '❌ ADMIN SETTINGS ERROR:',
            error.message
        );

        return res
            .status(500)
            .send('Unable to load settings page.');
    }
});

// =========================================================
// CSRF ERROR HANDLER
// =========================================================
// A stale browser page can submit an old token. Instead of showing
// a confusing 403/500 page, send the user back to login so a fresh
// session + fresh token is created.

router.use(
    (err, req, res, next) => {

        if (
            err &&
            err.code === 'EBADCSRFTOKEN'
        ) {

            console.error(
                '❌ CSRF TOKEN EXPIRED/INVALID:',
                req.method,
                req.originalUrl
            );

            if (
                req.path === '/login' ||
                req.originalUrl === '/admin/login'
            ) {
                return res.status(403).render(
                    'admin/login',
                    {
                        title:
                            'Admin Login - Gyan Jyoti School',

                        error:
                            'Security token expired. Refresh the page and login again.',

                        csrfToken:
                            typeof req.csrfToken === 'function'
                                ? req.csrfToken()
                                : ''
                    }
                );
            }

            return res.redirect(
                '/admin/login?error=session'
            );
        }

        return next(err);
    }
);


// =========================================================
// =========================================================
// EXPORT
// =========================================================

module.exports = router;