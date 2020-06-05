const jwt = require('jsonwebtoken');
const config = require('config');

function auth(req, res, next) {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).send('Access denied. No token provided.');

  try {
    const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).send('Invalid token.');
  }
}

// Try to authenticate, if not authenticated continue anyways
function checkAuth(req, res, next) {
  req.isAuthenticated = false;
  const token = req.header('x-auth-token');
  if (!token) {
    next();
    return;
  } 
  
  try {
    const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
    req.user = decoded;
    req.isAuthenticated = true;
    next();
  } catch (ex) {
    res.status(400).send('Invalid token.');
  } 
}

module.exports.auth = auth;
module.exports.checkAuth = checkAuth;