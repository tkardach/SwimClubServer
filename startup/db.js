/**
 * db.js initalizes the database
 */

const mongoose = require('mongoose');
const config = require('config');
const {logger} = require('../debug/logging');

module.exports = async function () {
  const db = config.get('db');
  await mongoose.connect(db, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true
  })
  .then(() => {
    logger.log({
      level: 'info',
      message: 'Connected to MongoDB database.'
    });
  })
  .catch((err) => {
    logger.log({
      level: 'error',
      message: err
    })
  });
}