require('../shared/extensions');
const {admin, checkAdmin} = require('../middleware/admin');
const {auth} = require('../middleware/auth');
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
const {errorResponse} = require('../shared/utility');
const path = require('path');


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

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/reservations.html'));
})

router.get('/:date', async (req, res) => {
  try {
    const result = await calendar.getEventsForDate(req.params.date);
    res.status(200).send(result);
  } catch (err) {
    logError(err, 'Error thrown while trying to post event to calendar');
    return res.status(500).send(errorResponse(500, 'Error thrown while trying to post event to calendar'));
  }
});

router.post('/', async (req, res) => {
  // Make sure required parameters are included in request body
  const { error } = validatePostReservation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // Check if memberEmail was supplied. If not, check for session
  if (!req.body.memberEmail && !req.user)
    return res.status(400).send(errorResponse(400, 'User must be signed in to reserve a timeslot'));

  if (!req.body.memberEmail) req.body.memberEmail = req.user.email;

  const date = new Date(req.body.date);

  let thisWeekEnd = new Date();

  let offset = 0;

  let now = new Date();
  if ((now.getDay() === 4 && now.getHours() >= 18) || now.getDay() === 5)
    offset = 7;

  if (thisWeekEnd.getDay() === 6) // weeks end on Thursday 6PM, find end of week relative to date
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 6 + offset);
  else
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 5 - thisWeekEnd.getDay() + offset);

  // Check if reservation date is greater than end of this week
  if (thisWeekEnd.compareDate(date) === -1)
    return res.status(400).send(errorResponse(400, 'You may not make reservations after this week (ending on Friday).'))

  // Validate the parameter time values
  if (!validateTime(req.body.start) || !validateTime(req.body.end))
    return res.status(400).send(errorResponse(400,ValidationStrings.Validation.InvalidTime));
  
  //#region Business Logic for Creating Reservations
  const allMembers = await sheets.getAllMembers(false);
  const paidMembers = await sheets.getAllPaidMembersDict(true);

  // Check if member making reservation exists
  const member = allMembers.filter(member => 
    member.primaryEmail.toLowerCase() === req.body.memberEmail.toLowerCase() ||
    member.secondaryEmail.toLowerCase() === req.body.memberEmail.toLowerCase());

  if (member.length === 0) // Member does not exist
    return res.status(404).send(errorResponse(404,`Member with email ${req.body.memberEmail} not found.`));
  if (member.length > 1) // Somehow there are multiple members with this email
    return res.status(400).send(errorResponse(400,`Multiple members with email ${req.body.memberEmail} found`));

  // Check if member has paid their dues
  if (!(member[0].id in paidMembers)) 
    return res.status(400).send(errorResponse(400,ValidationStrings.Reservation.PostDuesNotPaid.format(member[0].lastName)));
  
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
  const memberResWeek = eventsForWeek.filter(event => event.summary === member[0].certificateNumber || event.summary === `#${member[0].certificateNumber}`);

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
  const memberRes = eventsForDate.filter(event => event.summary === member[0].certificateNumber || event.summary === `#${member[0].certificateNumber}`);
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

  // Check if the timeslots for this day are full
  // TODO: This code is BAD. here we are using the POSTed start and end time as a reference. In the future
  // we should store a list of timeslots on server and client will use that
  
  const reservationsOnDay =  await calendar.getEventsForDateAndTime(date, date, req.body.start, req.body.end);
  if (reservationsOnDay.length >= 4)
    return res.status(400).send(errorResponse(400, 'All slots have been reserved for the specified time.'));

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
      return res.status(500).send(errorResponse(500,'Failed to post event to the calendar'));
    event.lastName = member[0].lastName;
    res.status(200).send(event);
  } catch (err) {
    logError(err, 'Error thrown while trying to post event to calendar');
    return res.status(500).send(errorResponse(500,'Error thrown while trying to post event to calendar'));
  }
});

router.put('/:id', [checkAdmin], async (req, res) => {
});

router.delete('/:id', async (req, res) => {
  if (!req.user)
    return res.status(400).send(errorResponse(400,'You must be signed in to delete events.'));

  if (!req.params.id) 
    return res.status(400).send(errorResponse(400,'Need event ID to delete event.'));

  const result = await calendar.deleteEventById(req.params.id);

  if (!result)
    return res.status(500).send(errorResponse(400,'Failed to delete event'));

  res.status(200).send("Successfully deleted event");
});

module.exports = router;