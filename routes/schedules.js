const {Schedule} = require('../models/schedule');
const express = require('express');
const router = express.Router();
const validateObjectId = require('../middleware/validateObjectId');
const {ValidationStrings} = require('../shared/strings');


// GET from the database
router.get('/', async (req, res) => {
  const schedules = await Schedule.find();
  res.status(200).send(schedules);
});

// GET from the database by current date
router.get('/current', async (req, res) => {
  const schedule = await Schedule.getCurrent();
  
  if (schedule)
    res.status(200).send(schedule);
  else
    res.status(404).send(ValidationStrings.Schedule.NoCurrentSchedule);
});

// GET from the database by date
router.get('/date/:date', async (req, res) => {
  if (!req.params || !req.params.date || req.params.date === undefined) 
    return res.status(400).send(ValidationStrings.Schedule.DateParamRequired);

  const date  = new Date(req.params.date);
  if (isNaN(date)) return res.status(400).send(ValidationStrings.Validation.InvalidDateFormat);

  const schedule = await Schedule.byDate(date);
  
  if (schedule)
    res.status(200).send(schedule);
  else
    res.status(404).send(ValidationStrings.Schedule.NoCurrentSchedule);
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