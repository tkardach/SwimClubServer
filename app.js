/**
 *  app.js establishes all things related to the backend and initializes them.
 */
const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const config = require('config');
const redis = require('redis');
const {uuidv4} = require('./shared/utility');
const RedisStore = require('connect-redis')(session);
const redisClient = redis.createClient();


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use('/images', express.static(path.join(__dirname, 'images')));

const sess = {
  secret: config.get('sessionSecret'),
  genid: function(req) {
    return uuidv4();
  },
  saveUninitialized: true,
  resave: false,
  store: new RedisStore({ client: redisClient, ttl: 86400 }),
  cookie: {}
}

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1) // trust first proxy
  sess.cookie.httpOnly = true,
  sess.cookie.secure= true,
  sess.cookie.sameSite= true,
  sess.cookie.maxAge= 600000
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session(sess));

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
    'https://api.saratogaswimclub.com',
    'https://tommy.kardach.com',
    'http://dev.saratogaswimclub.com',
    'https://dev.saratogaswimclub.com',
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

// Initialize api routes
require('./startup/routes')(app);

// Initialize Database
require('./startup/db')();

// Initialize Services
require('./startup/services');

module.exports = app;