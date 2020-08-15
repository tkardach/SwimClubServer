const {admin} = require('../middleware/admin');
const express = require('express');
const router = express.Router();
const sheets = require('../modules/google/sheets');
const _ = require('lodash');


// GET from the database
router.get('/', [admin], async (req, res) => {
  const accounts = await sheets.getAllAccounts();

  res.status(200).send(accounts);
});

module.exports = router;