/**
 *  Routes.js establishes the following:
 *    1. Sets up all middleware which requests will travel up to the final api destination
 *    2. Initializes the api destinations
 * 
 *  Note: express-session code has been commented out, we may want to use user sessions in the future
 */


const error = require('../middleware/error');
const express = require('express');
const users = require('../routes/users');
const home = require('../routes/home');
const reservations = require('../routes/reservations');
const members = require('../routes/members');


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

  app.use('/api/reservations', reservations);
  app.use('/api/members', members);
  app.use('/users', users);
  app.use('/', home);

  // Error handling middleware
  app.use(error);
}