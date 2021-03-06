/**
 *  Routes.js establishes the following:
 *    1. Sets up all middleware which requests will travel up to the final api destination
 *    2. Initializes the api destinations
 * 
 *  Note: express-session code has been commented out, we may want to use user sessions in the future
 */


const error = require('../middleware/error');
//const session = require('express-session');
const express = require('express');
const auth = require('../routes/auth');
const users = require('../routes/users');
const home = require('../routes/home');
const members = require('../routes/members');
const reservations = require('../routes/reservations');
const schedules = require('../routes/schedules');
const dues = require('../routes/dues');

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

module.exports = function (app) {
  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
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

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // app.use(session({
  //   secret: config.get('secret'),
  //   genid: function(req) {
  //     return uuidv4();
  //   },
  //   saveUninitialized: true,
  //   resave: false
  // }));
  
  app.use('/api/auth', auth);
  app.use('/api/members', members);
  app.use('/api/reservations', reservations);
  app.use('/api/schedules', schedules);
  app.use('/api/dues', dues);
  app.use('/api/users', users);
  app.use('/', home);

  // Error handling middleware
  app.use(error);
}