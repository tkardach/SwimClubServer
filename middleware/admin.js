const {securityLogger} = require('../debug/logging');

module.exports = function (req, res, next) {
  if (!req.user.isAdmin) {
    securityLogger.log({
      level: 'warn',
      message: req.body
    });
    return res.status(403).send('Access denied.');
  }
  next();
}