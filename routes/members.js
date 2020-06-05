const {Member, validatePostMember, validatePutMember} = require('../models/member');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const express = require('express');
const router = express.Router();
const validateObjectId = require('../middleware/validateObjectId');
const {ValidationStrings} = require('../shared/strings');
const {logInfo} = require('../debug/logging');
const _ = require('lodash');


// GET from the database
router.get('/', async (req, res) => {
  const members = await Member.find().select(
    '_id certificateNumber lastName numberOfMembers'
  );

  res.status(200).send(members);
});

// GET by id from database
router.get('/:id', async (req, res) => {
  res.status(200).send("");
});


// POST to database
router.post('/', [auth, admin], async (req, res) => {
  const { error } = validatePostMember(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // check to make sure no member with identical certificate number or last name exists
  const query = await Member.find({ 
    $or: [
      {lastName: req.body.lastName},
      {certificateNumber: req.body.certificateNumber}
    ]
    });
  if (query.length > 0) return res.status(400).send(ValidationStrings.Member.AlreadyExists);

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
    if (err)
      res.status(400).send(err);
    else
      res.status(200).send(member);
  });
});


// PUT to database
router.put('/:id', validateObjectId, async (req, res) => {
  res.status(200).send("");
});


// DELETE from database
router.delete('/:id', validateObjectId, async (req, res) => {
  res.status(200).send("");
});

module.exports = router;