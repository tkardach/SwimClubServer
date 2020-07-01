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
  let members;
  // If request is from admin, return all information
  if (req.isAdmin)
    members = await sheets.getAllMembersDict(false);
  else 
    members = await sheets.getAllMembersDict(true);

  if (!(req.params.id in members))
    return res.status(404).send(errorResponse(404, `Member with id ${req.params.id} not found.`));

  res.status(200).send(members[req.params.id]);
});


// POST to database
router.post('/', [admin], async (req, res) => {
  const { error } = validatePostMember(req.body);
  if (error) { 
    logError(error.details[0].message, error.details[0].message);
    return res.status(400).send(error.details[0].message);
  }

  // check to make sure no member with identical certificate number or last name exists
  const query = await Member.find({ 
    $or: [
      {lastName: req.body.lastName},
      {certificateNumber: req.body.certificateNumber}
    ]
    });
  if (query.length > 0) return res.status(400).send(errorResponse(400, ValidationStrings.Member.AlreadyExists));

  // try to add member to database
  const content = _.pick(req.body,
    [
      'certificateNumber',
      'lastName',
      'type',
      'salutation',
      'address',
      'location',
      'zip',
      'primaryPhone',
      'secondaryPhone',
      'primaryEmail',
      'secondaryEmail',
      'numberOfMembers'
    ]);

  // we are overriding _id to equal certificateNumber, must set manually
  content._id = req.body.certificateNumber;
  const member = new Member(content);

  await member.save(function (err, member) {
    if (err) {
      logError(err, err)
      res.status(400).send(errorResponse(400, err));
    }
    else
      res.status(200).send(member);
  });
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