const {admin, checkAdmin} = require('../middleware/admin');
const {auth} = require('../middleware/auth');
const express = require('express');
const router = express.Router();
const validateObjectId = require('../middleware/validateObjectId');
const {ValidationStrings} = require('../shared/strings');
const {logInfo, logError} = require('../debug/logging');
const sheets = require('../modules/google/sheets');
const _ = require('lodash');


// GET from the database
router.get('/', [admin], async (req, res) => {
  const accounts = await sheets.getAllAccounts();

  res.status(200).send(accounts);
});

module.exports = router;