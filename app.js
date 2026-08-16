var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var helmet = require('helmet');
var rateLimit = require('express-rate-limit');
var mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const compression = require('compression');

require('dotenv').config();


// =========================================================
// ROUTES
// =========================================================
const principalContactRouter =
    require('./routes/principalContact');

const paymentRouter =
    require('./routes/payment');

const feesRouter =
    require('./routes/fees');

const feesAdminRoutes =
    require('./routes/admin/fees');

const eventsAdminRoutes =
    require('./routes/admin/events');

const whatsappAdminRoutes =
    require('./routes/admin/whatsapp');

const facultyAdminRoutes =
    require('./routes/admin/faculty');

const academicsAdminRoutes =
    require('./routes/admin/academics');

const popupAdminRoutes =
    require('./routes/popupAdmin');

const indexRouter =
    require('./routes/index');

const usersRouter =
    require('./routes/users');

const contactRouter =
    require('./routes/contact');

const adminRouter =
    require('./routes/admin');

const eventsRouter =
    require('./routes/events');

const facultyRouter =
    require('./routes/faculty');

const academicsRouter =
    require('./routes/academics');

const admissionRouter =
    require('./routes/admission');

const enquiryRouter =
    require('./routes/enquiry');

const sportsDanceAdminRoutes =
    require('./routes/admin/sportsDance');


// =========================================================
// MIDDLEWARE
// =========================================================

const auth =
    require('./middleware/auth');


// =========================================================
// MONGOOSE
// =========================================================

var mongoose =
    require('mongoose');


// =========================================================
// DNS
// =========================================================

const dns =
    require('dns');

dns.setServers([
    '8.8.8.8',
    '1.1.1.1'
]);


// =========================================================
// APP
// =========================================================

var app =
    express();


// =========================================================
// PROXY
// =========================================================
//
// IMPORTANT:
// Localhost should NOT trust a proxy.
// Production can trust the reverse proxy.
//
// =========================================================

if (
    process.env.NODE_ENV ===
    'production'
) {

    app.set(
        'trust proxy',
        1
    );

}


// =========================================================
// SECURITY HEADERS
// =========================================================

app.use(
    helmet({
        contentSecurityPolicy: false
    })
);


// =========================================================
// COMPRESSION
// =========================================================

app.use(
    compression()
);


// =========================================================
// VIEW ENGINE
// =========================================================

app.set(
    'views',
    path.join(
        __dirname,
        'views'
    )
);

app.set(
    'view engine',
    'ejs'
);


// =========================================================
// GLOBAL RATE LIMITER
// =========================================================

if (
    process.env.NODE_ENV ===
    'production'
) {

    const limiter =
        rateLimit({

            windowMs:
                15 * 60 * 1000,

            max:
                1000,

            standardHeaders:
                true,

            legacyHeaders:
                false,

            message:
                'Too many requests. Please try again later.'

        });

    app.use(
        limiter
    );

}


// =========================================================
// ADMIN LOGIN RATE LIMITER
// =========================================================

const adminLoginLimiter =
    rateLimit({

        windowMs:
            15 * 60 * 1000,

        max:
            10,

        standardHeaders:
            true,

        legacyHeaders:
            false,

        message:
            'Too many login attempts. Please try again later.'

    });


// =========================================================
// BODY PARSERS
// =========================================================

app.use(
    express.json({
        limit:
            '1mb'
    })
);

app.use(
    express.urlencoded({
        extended:
            false,

        limit:
            '1mb'
    })
);

app.use(
    cookieParser()
);


// =========================================================
// MONGO SANITIZATION
// =========================================================

app.use(
    mongoSanitize()
);


// =========================================================
// HTTP PARAMETER POLLUTION PROTECTION
// =========================================================

app.use(
    hpp()
);


// =========================================================
// SESSION
// =========================================================

if (
    !process.env.SESSION_SECRET
) {

    console.error(
        '❌ SESSION_SECRET is missing from .env'
    );

    process.exit(1);

}


app.use(
    session({

        // A dedicated cookie name prevents an old/stale
        // connect.sid from being reused by this application.
        name:
            'gj_admin_sid',

        secret:
            process.env.SESSION_SECRET,

        resave:
            false,

        // Keep this false for security. The admin login creates
        // the authenticated session before protected routes run.
        saveUninitialized:
            false,

        // Only trust proxy in production.
        proxy:
            process.env.NODE_ENV ===
            'production',

        cookie: {

            httpOnly:
                true,

            secure:
                process.env.NODE_ENV ===
                'production',

            sameSite:
                'lax',

            maxAge:
                24 *
                60 *
                60 *
                1000

        }

    })
);


// =========================================================
// SESSION AVAILABILITY GUARD
// =========================================================
//
// CSRF tokens used by the admin router are stored in the
// express-session. This makes sure an existing session is
// available before protected routes are reached.
// =========================================================

app.use(
    function (req, res, next) {

        if (req.session) {
            req.session.touch();
        }

        next();
    }
);


// =========================================================
// STATIC PUBLIC FILES
// =========================================================

app.use(
    express.static(
        path.join(
            __dirname,
            'public'
        )
    )
);


// =========================================================
// UPLOADS
// =========================================================

app.use(
    '/uploads',
    express.static(
        path.join(
            __dirname,
            'uploads'
        )
    )
);


// =========================================================
// ADMIN LOGIN RATE LIMIT
// =========================================================

app.use(
    '/admin/login',
    adminLoginLimiter
);


// =========================================================
// ADMIN POPUP MANAGER
// =========================================================

app.use(
    '/admin/popup',
    auth,
    popupAdminRoutes
);



// =========================================================
// ADMIN GENERAL ROUTES
// =========================================================

app.use(
    '/admin',
    adminRouter
);


// =========================================================
// ADMIN EVENTS MANAGER
// =========================================================

app.use(
    '/admin/events',
    auth,
    eventsAdminRoutes
);


// =========================================================
// ADMIN FACULTY MANAGER
// =========================================================

app.use(
    '/admin/faculty',
    auth,
    facultyAdminRoutes
);


// =========================================================
// ADMIN FEES MANAGER
// =========================================================

app.use(
    '/admin/fees',
    auth,
    feesAdminRoutes
);


// =========================================================
// ADMIN WHATSAPP ANNOUNCEMENT
// =========================================================

app.use(
    '/admin/whatsapp',
    auth,
    whatsappAdminRoutes
);


// =========================================================
// ADMIN ACADEMICS / ACHIEVEMENTS MANAGER
// =========================================================

app.use(
    '/admin/academics',
    auth,
    academicsAdminRoutes
);


// =========================================================
// ADMIN SPORTS & DANCE
// =========================================================

app.use(
    '/admin/sports-dance',
    auth,
    sportsDanceAdminRoutes
);





// =========================================================
// HOME / INDEX ROUTES
// =========================================================
//
// IMPORTANT:
//
// indexRouter MUST come before eventsRouter.
//
// Express processes routes from top to bottom.
//
// GET /
//     -> indexRouter
//
// GET /gallery
//     -> eventsRouter
//
// GET /gallery/:id
//     -> eventsRouter
//
// =========================================================

app.use(
    '/',
    indexRouter
);


// =========================================================
// PUBLIC EVENTS ROUTES
// =========================================================

app.use(
    '/',
    eventsRouter
);


// =========================================================
// USERS
// =========================================================

app.use(
    '/users',
    usersRouter
);


// =========================================================
// CONTACT
// =========================================================

app.use(
    '/contact',
    contactRouter
);


// =========================================================
// ADMISSION
// =========================================================

app.use(
    '/admission',
    admissionRouter
);


// =========================================================
// ENQUIRY
// =========================================================

app.use(
    '/enquiry',
    enquiryRouter
);


// =========================================================
// EVENTS
// =========================================================
//
// Existing /events/... URLs are preserved.
//
// =========================================================

app.use(
    '/events',
    eventsRouter
);


// =========================================================
// FACULTY
// =========================================================

app.use(
    '/faculty',
    facultyRouter
);


// =========================================================
// ACADEMICS
// =========================================================

app.use(
    '/academics',
    academicsRouter
);

app.use(
    '/principal-contact',
    principalContactRouter
);
// =========================================================
// FEES
// =========================================================

app.use(
    '/fees',
    feesRouter
);


// =========================================================
// PAYMENT
// =========================================================

app.use(
    '/payment',
    paymentRouter
);

// =========================================================
// LEGAL PAGES
// =========================================================

app.get("/privacy-policy", (req, res) => {
    res.render("privacy-policy");
});

app.get("/terms", (req, res) => {
    res.render("terms");
});


// =========================================================
// 404 HANDLER
// =========================================================

app.use(
    function (
        req,
        res,
        next
    ) {

        console.log(
            '❌ 404 URL:',
            req.method,
            req.originalUrl
        );

        next(
            createError(404)
        );

    }
);


// =========================================================
// CSRF ERROR HANDLER
// =========================================================
//
// This handles EBADCSRFTOKEN cleanly.
// The actual CSRF verification is done inside
// the admin router.
//
// =========================================================

app.use(
    function (
        err,
        req,
        res,
        next
    ) {

        if (
            err &&
            err.code ===
            'EBADCSRFTOKEN'
        ) {

            console.error(
                '❌ Invalid CSRF token:',
                req.method,
                req.originalUrl
            );


            if (
                req.path ===
                '/login' &&
                req.method ===
                'POST'
            ) {

                try {

                    return res.status(403).render(
                        'admin/login',
                        {

                            title:
                                'Admin Login - Gyan Jyoti School',

                            error:
                                'Security token expired. Please refresh the login page and try again.',

                            csrfToken:
                                req.csrfToken()

                        }
                    );

                } catch (
                    csrfError
                ) {

                    console.error(
                        '❌ Could not regenerate CSRF token:',
                        csrfError
                    );

                }

            }


            // Never expose the expected/received CSRF token.
            return res.status(403).send(
                'Security token expired or invalid. Please refresh the page, sign in again, and retry.'
            );

        }


        next(err);

    }
);


// =========================================================
// ERROR HANDLER
// =========================================================

app.use(
    function (
        err,
        req,
        res,
        next
    ) {

        console.error(
            'Application error:',
            err
        );


        res.locals.message =
            err.message ||
            'Something went wrong';


        res.locals.error =
            req.app.get('env') ===
            'development'
                ? err
                : {};


        res.status(
            err.status ||
            500
        );


        res.render(
            'error'
        );

    }
);


// =========================================================
// MONGODB CONNECTION
// =========================================================

mongoose
    .connect(
        process.env.MONGO_URI
    )

    .then(() => {

        console.log(
            '✅ MongoDB Connected'
        );

    })

    .catch((err) => {

        console.error(
            '❌ DB Error:',
            err
        );

    });


// =========================================================
// EXPORT
// =========================================================

module.exports =
    app;