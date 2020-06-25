/**
 *  server.js intializes the entire application and hosts it on the specified port
 */

const config = require('config')
const {logger} = require('./debug/logging');
const app = require('./app.js');
const https = require('https');
const fs = require('fs');

if (!config.get("jwtPrivateKey")) {
  logger.log({
    level: 'error',
    message: 'jwtPrivateKey does not exist'
  });
  process.exit(1);
}

const port = process.env.PORT || config.get('port');

if (!config.get("serverKey") || !config.get("serverCert")) {
  logger.log({
    level: 'error',
    message: 'serverKey or serverCert does not exist'
  });
  process.exit(1);
}

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

const server = https.createServer({
  key: fs.readFileSync(config.get("serverKey")),
  cert: fs.readFileSync(config.get("serverCert"))
}, app)
.listen(port, () => {
  logger.log({
    level: 'info',
    message: `App listening on port ${port}`
  });
});

module.exports = server;