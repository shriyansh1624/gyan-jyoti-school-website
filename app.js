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

const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

var mongoose = require('mongoose');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var contactRouter = require('./routes/contact');
var adminRouter = require('./routes/admin');
var eventsRouter = require('./routes/events');
var facultyRouter = require('./routes/faculty');
var academicsRouter = require('./routes/academics');
var admissionRouter = require('./routes/admission');
var enquiryRouter = require('./routes/enquiry');

var app = express();
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false
}));

app.use(compression());

app.use(mongoSanitize());

app.use(hpp());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests. Please try again later.'
});

app.use(limiter);

const adminLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/admin/login', adminLimiter);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.log('❌ DB Error:', err));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(helmet({
  contentSecurityPolicy: false
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests. Please try again later.'
}));

app.use(logger('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(cookieParser());
app.use(mongoSanitize());

app.use(session({
  secret: process.env.SESSION_SECRET || 'gyan-jyoti-secret-key',
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/contact', contactRouter);
app.use('/admin', adminRouter);
app.use('/admission', admissionRouter);
app.use('/enquiry', enquiryRouter);
app.use('/events', eventsRouter);
app.use('/faculty', facultyRouter);
app.use('/academics', academicsRouter);

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message || 'Something went wrong';
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;