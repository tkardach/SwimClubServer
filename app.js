/**
 *  app.js establishes all things related to the backend and initializes them.
 */

const {logger} = require('./debug/logging')
const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const config = require('config');

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(session({
  secret: config.get('sessionSecret'),
  genid: function(req) {
    return uuidv4();
  },
  saveUninitialized: true,
  resave: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Initialize api routes
require('./startup/routes')(app);

// Initialize Database
require('./startup/db')();

module.exports = app;