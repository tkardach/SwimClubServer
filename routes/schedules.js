const {Schedule, validatePostSchedule, validatePutSchedule} = require('../models/schedule');
const {Timeslot, validatePostTimeslot, validatePutTimeslot} = require('../models/timeslot');
const express = require('express');
const router = express.Router();
const validateObjectId = require('../middleware/validateObjectId');
const {ValidationStrings} = require('../shared/strings');
const {auth, checkAuth} = require('../middleware/auth');
const {admin, checkAdmin} = require('../middleware/admin');
const mongoose = require('mongoose')
const _ = require('lodash');


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
router.post('/', [auth, admin], async (req, res) => {
  const { error } = validatePostSchedule(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // Add timeslot list from POST body
  const timeslots = [];
  if (req.body.timeslots && req.body.timeslots instanceof Array) {
    for (const slot of req.body.timeslots) {
      if (req.body.startTime > slot.startTime || req.body.endTime < slot.endTime)
        return res.status(400).send(ValidationStrings.Schedule.TimeslotOutOfRange);

      let timeslot = await Timeslot.byRange(slot.startTime, slot.endTime);
      // If there already exists a timeslot with this range, use that
      if (timeslot.length === 0) {
        let newTimeslot = new Timeslot({
          startTime: slot.startTime,
          endTime: slot.endTime
        });
        // Add timeslot to objectId list
        await newTimeslot.save(function (err, timeslot) {
          if (err)
            return res.status(400).send(err);
        });

        timeslots.push(newTimeslot._id);
      }
      else
        timeslots.push(timeslot._id);
    }
  }

  req.body.timeslots = timeslots;

  const schedule = new Schedule(_.pick(req.body,
    [
      'weekdays',
      'startTime',
      'endTime',
      'start',
      'end',
      'maxReservations',
      'timeslots'
    ]));

  await schedule.save(function (err, reservation) {
    if (err)
      res.status(400).send(err);
    else
      res.status(200).send(reservation);
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