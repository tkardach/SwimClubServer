const {uncaughtExceptions} = require('../debug/logging');

module.exports = function (err, req, res, next) {
  uncaughtExceptions.log({
    level: 'error',
    message: err.message
  });

  res.status(500).send('Internal server error.');
}