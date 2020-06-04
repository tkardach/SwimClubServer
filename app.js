/**
 *  app.js establishes all things related to the backend and initializes them.
 */

const {logger} = require('./debug/logging')
const express = require('express');
const app = express();

// Initialize api routes
require('./startup/routes')(app);

// Initialize Database
require('./startup/db')();

module.exports = app;