const {admin} = require('../middleware/admin');
const express = require('express');
const router = express.Router();
const sheets = require('../modules/google/sheets');
const _ = require('lodash');


// GET from the database
router.get('/', [admin], async (req, res) => {
  const members = await sheets.getAllMembers(false);

  res.status(200).send(members);
});

// GET from the database
router.get('/paid-members', [admin], async (req, res) => {
  const members = await sheets.getAllPaidMembers(false);

  res.status(200).send(members);
});

// GET by id from database
router.get('/:id', [admin], async (req, res) => {
  if (req.params.id && req.params.id === 'paid-members')
    return res.redirect('/api/members/paid-members');
  const members = await sheets.getAllMembersDict(false);

  if (!members)
    return res.status(500).send('There was an error gathering member information, please try again later');

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