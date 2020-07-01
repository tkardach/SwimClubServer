const {securityLogger} = require('../debug/logging');

function admin(req, res, next) {
  if (!(req.user && req.user.isAdmin)) {
    securityLogger.log({
      level: 'warn',
      message: req.body
    });
    return res.status(403).send('Access denied.');
  }
  next();
}

function checkAdmin(req, res, next) {
  req.isAdmin = req.user && req.user.isAdmin;

  next();
}

module.exports.admin = admin; 
module.exports.checkAdmin = checkAdmin; 