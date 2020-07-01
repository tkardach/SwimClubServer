const {securityLogger} = require('../debug/logging');
const {User} = require('../models/user');

async function admin(req, res, next) {
  const secMessage = {
    body: req.body,
    origin: req.headers.origin
  }
  if (!(req.user && req.user.isAdmin && req.user.email)) {
    securityLogger.log({
      level: 'warn',
      message: secMessage
    });
    return res.status(403).send('Access denied.');
  }

  const user = await User.findOne({email: req.user.email.toLowerCase()});
  if (!(user && user.isAdmin)) {
    securityLogger.log({
      level: 'warn',
      message: secMessage
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