const {Due, validatePostDue, validatePutDue} = require('../models/due');
const {auth, checkAuth} = require('../middleware/auth');
const {admin, checkAdmin} = require('../middleware/admin');
const express = require('express');
const router = express.Router();
const validateObjectId = require('../middleware/validateObjectId');
const _ = require('lodash');


// GET from the database
router.get('/', [auth, admin], async (req, res) => {
  const dues = await Due.find();
  res.status(200).send(dues);
});

// GET by id from database
router.get('/:id', async (req, res) => {
  res.status(200).send("");
});

// POST to database
router.post('/', [auth, admin], async (req, res) => {
  const { error } = validatePostDue(req.body);
  if (error) return res.status(400).send(error.details[0].message);


  // try to add member to database
  const due = new Due(_.pick(req.body,
    [
      'member',
      'date',
      'check',
      'membershipYear',
      'amount'
    ]));

  await due.save(function (err, member) {
    if (err)
      res.status(400).send(err);
    else
      res.status(200).send(due);
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