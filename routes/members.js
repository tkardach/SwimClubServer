const {Member, validatePostMember, validatePutMember} = require('../models/member');
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
  const members = await sheets.getAllMembers(false);

  res.status(200).send(members);
});

// GET by id from database
router.get('/:id', [admin], async (req, res) => {
  const members = await sheets.getAllMembersDict(false);

  if (!(req.params.id in members))
    return res.status(404).send(errorResponse(404, `Member with id ${req.params.id} not found.`));

  res.status(200).send(members[req.params.id]);
});


// POST to database
router.post('/', [admin], async (req, res) => {
  return res.status(200).send('Feature under development')
});


// PUT to database
router.put('/:id', [admin], async (req, res) => {
  res.status(200).send("");
});


// DELETE from database
router.delete('/:id', [admin], async (req, res) => {
  res.status(200).send("");
});

module.exports = router;