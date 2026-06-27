var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');

require('dotenv').config();

const dns = require('dns');
dns.setServers(["8.8.8.8", "1.1.1.1"]);

var mongoose = require('mongoose');

// Routers
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

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ DB Error:", err));

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Session Configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ================= ROUTES =================

app.use('/', indexRouter);

app.use('/users', usersRouter);

app.use('/contact', contactRouter);

app.use('/admin', adminRouter);

app.use('/admission', admissionRouter);

app.use('/enquiry', enquiryRouter);

app.use('/events', eventsRouter);

app.use('/faculty', facultyRouter);

app.use('/academics', academicsRouter);

// ================= 404 =================

app.use(function(req, res, next) {
  next(createError(404));
});

// ================= ERROR HANDLER =================

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error =
    req.app.get('env') === 'development'
      ? err
      : {};

  res.status(err.status || 500);

  res.render('error');
});

module.exports = app;