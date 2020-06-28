require('../shared/extensions');
const {auth, checkAuth} = require('../middleware/auth');
const {admin, checkAdmin} = require('../middleware/admin');
const Joi = require("joi");
const express = require('express');
const router = express.Router();
const validateObjectId = require('../middleware/validateObjectId');
const {ValidationStrings} = require('../shared/strings');
const {validateTime} = require('../shared/validation');
const calendar = require('../modules/google/calendar');
const sheets = require('../modules/google/sheets');
const {Reservation} = require('../models/reservation');
const _ = require('lodash');
const { logError } = require('../debug/logging');


// Validates a /POST request
function validatePostReservation(res) {
  const schema = {
    location: Joi.string().optional(),
    description: Joi.string().optional(),
    date: Joi.date().required(),
    start: Joi.number().required(),
    end: Joi.number().required(),
    attendees: Joi.array().items(Joi.string()).optional(),
    memberEmail: Joi.string().required()
  };

  return Joi.validate(res, schema);
}

// Validates a /GET/:date request
function validateGetReservation(res) {
  const schema = {
    date: Joi.date().required()
  };

  return Joi.validate(res, schema);
}

router.get('/:date', async (req, res) => {
  try {
    const result = await calendar.getEventsForDate(req.params.date);
    res.status(200).send(result);
  } catch (err) {
    logError(err, 'Error thrown while trying to post event to calendar');
    return res.status(500).send('Error thrown while trying to post event to calendar');
  }
});

router.post('/', async (req, res) => {
  const { error } = validatePostReservation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const date = new Date(req.body.date);

  if (!validateTime(req.body.start) || !validateTime(req.body.end))
    return res.status(400).send(ValidationStrings.Validation.InvalidTime);
  
  const allMembers = await sheets.getAllMembers(false);
  const paidMembers = await sheets.getAllPaidMembersDict(true);

  const member = allMembers.filter(member => 
    member.primaryEmail.toLowerCase() === req.body.memberEmail.toLowerCase() ||
    member.secondaryEmail.toLowerCase() === req.body.memberEmail.toLowerCase());

  if (member.length === 0)
    return res.status(404).send(`Member with email ${req.body.memberEmail} not found.`);
  if (member.length > 1)
    return res.status(400).send(`Multiple members with email ${req.body.memberEmail} found`);
  if (!(member[0].certificateNumber in paidMembers))
    return res.status(400).send(ValidationStrings.Reservation.PostDuesNotPaid.format(member[0].lastName));
  
  const eventsForDate = await calendar.getEventsForDate(date);
  const memberRes = eventsForDate.filter(event => event.summary === member[0].certificateNumber);
  if (memberRes.length !== 0)
    return res.status(400).send(`Member already has more than 1 reservation for today.`);

  let weekStart = new Date(date);
  weekStart.setHours(0,0,0,0);
  let weekEnd = new Date(date);

  if (weekStart.getDay() !== 6)
    weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + 1));

  if (weekEnd.getDay() === 6)
    weekEnd.setDate(weekEnd.getDate() + 6);
  else
    weekEnd.setDate(weekEnd.getDate() + 6 - weekEnd.getDay());

  const eventsForWeek = await calendar.getEventsForDateAndTime(weekStart, weekEnd, 0, 2359);
  const memberResWeek = eventsForWeek.filter(event => event.summary === member[0].certificateNumber);
  if (memberResWeek.length >= 3) 
    return res.status(400).send(`Member already has more than 3 reservations for this week.`);

  const attendees = [req.body.memberEmail]

  const event = calendar.generateEvent(
    member[0].certificateNumber,
    req.body.location,
    req.body.description,
    date,
    date,
    req.body.start,
    req.body.end,
    attendees
  );

  try {
    const result = await calendar.postEventToCalendar(event);

    if (!result)
      return res.status(500).send('Failed to post event to the calendar');
    event.lastName = member[0].lastName;
    res.status(200).send(event);
  } catch (err) {
    logError(err, 'Error thrown while trying to post event to calendar');
    return res.status(500).send('Error thrown while trying to post event to calendar');
  }
});

router.put('/:id', [checkAuth, checkAdmin], async (req, res) => {
});

router.delete('/:id', validateObjectId, async (req, res) => {
  res.status(200).send("This feature is currently under development");
});

module.exports = router;