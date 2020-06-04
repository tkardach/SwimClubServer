const {DateModel} = require('../models/date');
const express = require('express');
const router = express.Router();
const validateObjectId = require('../middleware/validateObjectId');


// GET from the database
router.get('/', async (req, res) => {
  res.status(200).send("");
});

// GET by id from database
router.get('/:id', async (req, res) => {
  res.status(200).send("");
});


// POST to database
router.post('/', async (req, res) => {
  res.status(200).send("");
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