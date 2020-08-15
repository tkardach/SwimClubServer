/**
 *  Routes.js establishes the following:
 *    1. Sets up all middleware which requests will travel up to the final api destination
 *    2. Initializes the api destinations
 * 
 *  Note: express-session code has been commented out, we may want to use user sessions in the future
 */


const error = require('../middleware/error');
const users = require('../routes/users');
const home = require('../routes/home');
const reservations = require('../routes/reservations');
const accounts = require('../routes/accounts');
const members = require('../routes/members');
const issues = require('../routes/issues');
const schedules = require('../routes/schedules');

module.exports = function (app) {
  app.use('/api/reservations', reservations);
  app.use('/api/accounts', accounts);
  app.use('/api/members', members);
  app.use('/api/users', users);
  app.use('/api/issues', issues);
  app.use('/api/schedules', schedules);
  app.use('/', home);

  // Error handling middleware
  app.use(error);
}