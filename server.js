/**
 *  server.js intializes the entire application and hosts it on the specified port
 */

const config = require('config')
const {logInfo, logError} = require('./debug/logging');
const app = require('./app.js');

// Make sure jwtPrivateKey is defined, necessary 
// for user identification and security
if (!config.get("jwtPrivateKey")) {
  logError(new Error('jwtPrivateKey does not exist'), 'jwtPrivateKey does not exist')
  process.exit(1);
}

// Define server port
const port = process.env.PORT || config.get('port');

// Start and return the server object
const server = app.listen(port, () => {
  logInfo(`App listening on port ${port}`);
});

module.exports = server;