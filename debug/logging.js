const winston = require('winston');
const {format} = winston;
const path = require('path')

const logFormat = format.printf(info => `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`)

// General logger
const logger = winston.createLogger({
  level: 'info',
  format: format.combine(
    format.label({ label: path.basename(require.main.filename) }),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    // Format the metadata object
    format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] })
  ),
  transports: [
    //
    // - Write to all logs with level `info` and below to `logs_general.log` 
    // - Write all logs error (and below) to `logs_error.log`.
    //
    new winston.transports.File({ 
      filename: 'logs_error.log', 
      level: 'error',
      format: format.combine(
        format.json()
      )}),
    new winston.transports.File({ 
      filename: 'logs_general.log',
      format: format.combine(
        format.json()
      ) })
  ]
});

// Security logger monitors all suspicious activity that could be a security threat
const securityLogger = winston.createLogger({
  transports: [
    new winston.transports.File({ 
      filename: 'logs_security.log',
      format: format.combine(
        format.json()
      ) })
  ]
});

// Uncaught exceptions loggers logs all uncaught exceptions
const uncaughtExceptions = winston.createLogger({
  transports: [
    new winston.transports.File({ 
      filename: 'logs_uncaughtEx.log', 
      level: 'error',
      format: format.combine(
        format.json()
      ) })
  ]
});

// If we are in test mode, remove all transports and use only the test logging files
if (process.env.NODE_ENV === 'test') {
  securityLogger.clear();
  logger.clear();
  uncaughtExceptions.clear();

  securityLogger.add(new winston.transports.File({ filename: 'tests_security.log' }));
  logger.add(new winston.transports.File({ filename: 'tests_general.log' }));
  uncaughtExceptions.add(new winston.transports.File({ filename: 'tests_uncaughtEx.log', level: 'error' }));

// If we are not in production mode, add console logging
} else if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: format.combine(
      format.colorize(),
      logFormat
    )
  }));
  uncaughtExceptions.add(new winston.transports.Console({
    format: format.combine(
      format.colorize(),
      logFormat
    )
  }));
}

function logError(err, desc) {
  if (err instanceof Error) {
    logger.log({
      level: 'error',
      message: desc,
      meta: {
        error: `${err.stack || err}`
      }
    })
  } else {
    logger.log({
      level: 'error',
      message: desc,
      meta: {
        error: err
      }
    })
  }
}

function logInfo(message) {
  logger.log({
    level: 'info',
    message: message
  })
}


module.exports.logError = logError;
module.exports.logInfo = logInfo;
module.exports.logger = logger;
module.exports.uncaughtExceptions = uncaughtExceptions;
module.exports.securityLogger = securityLogger;