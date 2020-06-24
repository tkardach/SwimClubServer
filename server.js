/**
 *  server.js intializes the entire application and hosts it on the specified port
 */

const config = require('config')
const {logger} = require('./debug/logging');
const app = require('./app.js');

if (!config.get("jwtPrivateKey")) {
  logger.log({
    level: 'error',
    message: 'jwtPrivateKey does not exist'
  });
  process.exit(1);
}

const port = process.env.PORT || config.get('port');

const server = app.listen(port, () => {
  logger.log({
    level: 'info',
    message: `App listening on port ${port}`
  });
});

module.exports = server;