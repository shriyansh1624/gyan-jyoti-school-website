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

const feesRouter = require('./routes/fees');

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

var mongoose = require('mongoose');


// =========================================================
// DNS
// =========================================================

const dns = require('dns');

dns.setServers([
    '8.8.8.8',
    '1.1.1.1'
]);


// =========================================================
// APP
// =========================================================

var app = express();


// =========================================================
// PROXY
// =========================================================

app.set(
    'trust proxy',
    1
);


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
//
// Development mein disable rakha hai because browser
// bahut saare requests karta hai while developing.
//
// Production mein 1000 requests / 15 minutes allowed.
//

if (process.env.NODE_ENV === 'production') {

    const limiter = rateLimit({

        windowMs:
            15 * 60 * 1000,

        max: 1000,

        standardHeaders: true,

        legacyHeaders: false,

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

        max: 10,

        standardHeaders: true,

        legacyHeaders: false,

        message:
            'Too many login attempts. Please try again later.'

    });


// =========================================================
// BODY PARSERS
// =========================================================

app.use(
    express.json({
        limit: '1mb'
    })
);

app.use(
    express.urlencoded({
        extended: false,
        limit: '1mb'
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

if (!process.env.SESSION_SECRET) {

    console.error(
        '❌ SESSION_SECRET is missing from .env'
    );

    process.exit(1);
}

app.use(
    session({

        secret:
            process.env.SESSION_SECRET,

        resave: false,

        saveUninitialized: false,

        proxy: true,

        cookie: {

            httpOnly: true,

            secure:
                process.env.NODE_ENV === 'production',

            sameSite: 'lax',

            maxAge:
                24 * 60 * 60 * 1000

        }

    })
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
// ADMIN POPUP MANAGER
// =========================================================

app.use(
    '/admin/popup',
    auth,
    popupAdminRoutes
);


// =========================================================
// PUBLIC ROUTES
// =========================================================

app.use(
    '/',
    indexRouter
);

app.use(
    '/users',
    usersRouter
);

app.use(
    '/contact',
    contactRouter
);

app.use(
    '/admission',
    admissionRouter
);

app.use(
    '/enquiry',
    enquiryRouter
);

app.use(
    '/events',
    eventsRouter
);

app.use(
    '/faculty',
    facultyRouter
);

app.use(
    '/academics',
    academicsRouter
);

app.use(
    '/fees',
    feesRouter
);

// =========================================================
// 404 HANDLER
// =========================================================

app.use(
    function (req, res, next) {

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
// ERROR HANDLER
// =========================================================

app.use(
    function (err, req, res, next) {

        console.error(
            'Application error:',
            err
        );

        res.locals.message =
            err.message ||
            'Something went wrong';

        res.locals.error =
            req.app.get('env') === 'development'
                ? err
                : {};

        res.status(
            err.status || 500
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

module.exports = app;