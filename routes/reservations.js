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
    memberEmail: Joi.string().optional()
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
    return res.status(500).send({message:'Error thrown while trying to post event to calendar'});
  }
});

router.post('/', async (req, res) => {
  // Make sure required parameters are included in request body
  const { error } = validatePostReservation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // Check if memberEmail was supplied. If not, check for session
  if (!req.body.memberEmail && !req.user)
    return res.status(400).send({message:'User must be signed in to reserve a timeslot'});

  if (!req.body.memberEmail) req.body.memberEmail = req.user.email;

  const date = new Date(req.body.date);

  let thisWeekEnd = new Date();

  if (thisWeekEnd.getDay() === 6) // weeks end on friday, find end of week relative to date
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 6);
  else
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 5 - thisWeekEnd.getDay());

  // Check if reservation date is greater than end of this week
  if (thisWeekEnd.compareDate(date) === -1)
    return res.status(400).send({message:'You may not make reservations after this week (ending on Friday).'})

  // Validate the parameter time values
  if (!validateTime(req.body.start) || !validateTime(req.body.end))
    return res.status(400).send({message:ValidationStrings.Validation.InvalidTime});
  
  //#region Business Logic for Creating Reservations
  const allMembers = await sheets.getAllMembers(false);
  const paidMembers = await sheets.getAllPaidMembersDict(true);

  // Check if member making reservation exists
  const member = allMembers.filter(member => 
    member.primaryEmail.toLowerCase() === req.body.memberEmail.toLowerCase() ||
    member.secondaryEmail.toLowerCase() === req.body.memberEmail.toLowerCase());

  if (member.length === 0) // Member does not exist
    return res.status(404).send({message:`Member with email ${req.body.memberEmail} not found.`});
  if (member.length > 1) // Somehow there are multiple members with this email
    return res.status(400).send({message:`Multiple members with email ${req.body.memberEmail} found`});

  // Check if member has paid their dues
  if (!(member[0].certificateNumber in paidMembers)) 
    return res.status(400).send({message:ValidationStrings.Reservation.PostDuesNotPaid.format(member[0].lastName)});
  
  // Check if member has already made max reservations for the week
  let weekStart = new Date(date);
  weekStart.setHours(0,0,0,0);
  let weekEnd = new Date(weekStart);

  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 1) % 7)); // weeks start on saturday, find begininning of week relative to date

  if (weekEnd.getDay() === 6) // weeks end on friday, find end of week relative to date
    weekEnd.setDate(weekEnd.getDate() + 6);
  else
    weekEnd.setDate(weekEnd.getDate() + 5 - weekEnd.getDay());

  const eventsForWeek = await calendar.getEventsForDateAndTime(weekStart, weekEnd, 0, 2359);
  const memberResWeek = eventsForWeek.filter(event => event.summary === member[0].certificateNumber);

  let today = new Date();
  let sameDayRes = (memberResWeek.length === 3 && today.compareDate(date) === 0);
  if (memberResWeek.length >= 3 && !sameDayRes) {
    const data = [];
    memberResWeek.forEach(res => {
      let sd = new Date(res.start.dateTime);
      let ed = new Date(res.end.dateTime);
      data.push({
        htmlLink: res.htmlLink,
        start: sd,
        end: ed
      });
    })
    let sameDayUsed = today.compareDate(date) === 0 ? ' And you have already used your same-day reservation for today.' : '';
    let message = ValidationStrings.Reservation.PostMaxReservationsMadeForWeek.format('three') + sameDayUsed;
    const err = {
      message: message,
      data: data
    }
    return res.status(400).send(err);
  }

  // Check if member has already made a reservation for the given date
  const eventsForDate = await calendar.getEventsForDate(date);
  const memberRes = eventsForDate.filter(event => event.summary === member[0].certificateNumber);
  if (memberRes.length !== 0) {
    const data = [];
    memberRes.forEach(res => {
      let sd = new Date(res.start.dateTime);
      let ed = new Date(res.end.dateTime);
      data.push({
        htmlLink: res.htmlLink,
        start: sd,
        end: ed
      });
    })
    const err = {
      message: ValidationStrings.Reservation.PostMaxReservationsMadeForDay.format('one', date.toLocaleDateString()),
      data: data
    }
    return res.status(400).send(err);
  }

  //#endregion

  // Create event and post it to the calendar
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
      return res.status(500).send({message:'Failed to post event to the calendar'});
    event.lastName = member[0].lastName;
    res.status(200).send(event);
  } catch (err) {
    logError(err, 'Error thrown while trying to post event to calendar');
    return res.status(500).send({message:'Error thrown while trying to post event to calendar'});
  }
});

router.put('/:id', [checkAuth, checkAdmin], async (req, res) => {
});

router.delete('/:id', async (req, res) => {
  if (!req.user)
    return res.status(400).send({message:'You must be signed in to delete events.'});

  if (!req.params.id) 
    return res.status(400).send({message:'Need event ID to delete event.'});

  const result = await calendar.deleteEventById(req.params.id);

  if (!result)
    return res.status(500).send({message:'Failed to delete event'});

  res.status(200).send("Successfully deleted event");
});

module.exports = router;