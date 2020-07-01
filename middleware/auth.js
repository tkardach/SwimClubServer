const {securityLogger} = require('../debug/logging');

function auth(req, res, next) {
  if (!(req.user)) {
    securityLogger.log({
      level: 'warn',
      message: req.body
    });
    return res.status(403).send('Access denied.');
  }
  next();
}

module.exports.auth = auth; 