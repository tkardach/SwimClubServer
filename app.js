/**
 *  app.js establishes all things related to the backend and initializes them.
 */
const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const config = require('config');
const fs = require('fs');

var staticRoot = __dirname + "/dist/swimclub-client/";

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: config.get('sessionSecret'),
  genid: function(req) {
    return uuidv4();
  },
  saveUninitialized: true,
  resave: false,
  cookie: {
    maxAge: 36000000,
    httpOnly: true,
    secure: false
  }
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next) {
  var regList = [
    'https:\/\/.*-embeds.googleusercontent.com',
    'http.*://localhost.*',
    'http.*://127.0.0.1.*'
  ]
  var whitelist = [
    'http://localhost:5500',
    'http://localhost:5501',
    'http://127.0.0.1:5500',
    'http://127.0.0.1:5501',
    'http://www.kardachkandles.com',
    'https://www.kardachkandles.com',
    'http://api.saratogaswimclub.com',
    'https://api.saratogaswimclub.com'
  ];

  let reg = new RegExp(regList.join("|"));
  var origin = req.headers.origin;
  if (origin && (whitelist.indexOf(origin) > -1 || reg.test(origin))) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Length, X-Requested-With");

  //intercepts OPTIONS method
  if ('OPTIONS' === req.method) {
    //respond with 200
    res.sendStatus(200);
  }
  else {
  //move on
    next();
  }
});


app.use(function(req, res, next) {
  //if the request is not html then move along
  var accept = req.accepts('html', 'json', 'xml');
  if (accept !== 'html') {
      return next();
  }

  // if the request has a '.' assume that it's for a file, move along
  var ext = path.extname(req.path);
  if (ext !== '') {
      return next();
  }

  fs.createReadStream(staticRoot + 'index.html').pipe(res);
});
app.use(express.static(staticRoot));

// Initialize api routes
require('./startup/routes')(app);

// Initialize Database
require('./startup/db')();

// Initialize Services
require('./startup/services');

module.exports = app;