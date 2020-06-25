/**
 *  server.js intializes the entire application and hosts it on the specified port
 */

const config = require('config')
const {logger} = require('./debug/logging');
const app = require('./app.js');
const https = require('https');
const fs = require('fs');

// Make sure jwtPrivateKey is defined, necessary 
// for user identification and security
if (!config.get("jwtPrivateKey")) {
  logger.log({
    level: 'error',
    message: 'jwtPrivateKey does not exist'
  });
  process.exit(1);
}

// Define server port
const port = process.env.PORT || config.get('port');

// Make sure server key and certificate are defined, 
// necessary for https security (self-signed)
if (!config.get("serverKey") || !config.get("serverCert")) {
  logger.log({
    level: 'error',
    message: 'serverKey or serverCert does not exist'
  });
  process.exit(1);
}

// Make sure server key and certificate files exist,
// necessary for security
try {
  fs.existsSync(config.get("serverKey"));
  fs.existsSync(config.get("serverCert"));
} catch(err) {
  logger.log({
    level: 'error',
    message: 'serverKey or serverCert file does not exist.'
  });
  process.exit(1);
}

let server;
// currently I cannot create a trusted connection. We will have to use an unsecure connection for now
if (process.env.NODE_ENV === 'test' || true) {
  // Start and return the server object
  server = app.listen(port, () => {
    logger.log({
      level: 'info',
      message: `App listening on port ${port}`
    });
  });
}
else 
{
  // Start and return the server object
  server = https.createServer({
    key: fs.readFileSync(config.get("serverKey")),
    cert: fs.readFileSync(config.get("serverCert"))
  }, app)
  .listen(port, () => {
    logger.log({
      level: 'info',
      message: `App listening on port ${port}`
    });
  });
}

module.exports = server;