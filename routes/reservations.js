require('../shared/extensions');
const {checkAdmin} = require('../middleware/admin');
const Joi = require("joi");
const express = require('express');
const router = express.Router();
const {ValidationStrings, StringConstants} = require('../shared/strings');
const {validateTime} = require('../shared/validation');
const calendar = require('../modules/google/calendar');
const sheets = require('../modules/google/sheets');
const {sendEmail} = require('../modules/google/email');
const _ = require('lodash');
const { logError, logInfo } = require('../debug/logging');
const {errorResponse, datetimeToNumberTime, isDevEnv} = require('../shared/utility');
const {getTimeslotsForDate, getCurrentWeekEnd} = require('../shared/timeslots')
const path = require('path');
const config = require('config');


// Validates a /POST request
function validatePostReservation(res) {
  const schema = {
    location: Joi.string().optional(),
    description: Joi.string().optional(),
    type: Joi.string().required(),
    date: Joi.date().required(),
    start: Joi.number().required(),
    end: Joi.number().required(),
    attendees: Joi.array().items(Joi.string()).optional(),
    memberEmail: Joi.string().optional(),
    numberSwimmers: Joi.number().required()
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

router.get('/calendar-id', (req, res) => {
  const calendarId = config.get('calendarId');
  if (calendarId)
    return res.status(200).json(calendarId);
  res.status(404).send(errorResponse(404, 'Calendar ID could not be found'));
})

router.get('/:date', async (req, res) => {
  try {
    const result = await calendar.getEventsForDate(req.params.date);
    res.status(200).send(result);
  } catch (err) {
    logError(err, 'Error thrown while trying to get events from calendar');
    return res.status(500).send(errorResponse(500, 'Error thrown while trying to get events from calendar'));
  }
});

router.get('/family/:date', async (req, res) => {
  try {
    const result = await calendar.getEventsForDate(req.params.date);
    const filtered = result.filter(event => 
      event.description === 'family' || 
      !event.hasOwnProperty('description') ||
      event.description === 'blocked');
    res.status(200).send(filtered);
  } catch (err) {
    logError(err, 'Error thrown while trying to get events from calendar');
    return res.status(500).send(errorResponse(500, 'Error thrown while trying to get events from calendar'));
  }
});

router.get('/lap/:date', async (req, res) => {
  try {
    const result = await calendar.getEventsForDate(req.params.date);
    const filtered = result.filter(event => 
      event.description === 'lap' ||
      event.description === 'blocked');
    res.status(200).send(filtered);
  } catch (err) {
    logError(err, 'Error thrown while trying to get events from calendar');
    return res.status(500).send(errorResponse(500, 'Error thrown while trying to get events from calendar'));
  }
});

router.get('/blocked/:date', async (req, res) => {
  try {
    const result = await calendar.getEventsForDate(req.params.date);
    const filtered = result.filter(event => event.description === 'blocked');
    res.status(200).send(filtered);
  } catch (err) {
    logError(err, 'Error thrown while trying to get events from calendar');
    return res.status(500).send(errorResponse(500, 'Error thrown while trying to get events from calendar'));
  }
});

router.post('/', async (req, res) => {
  // Make sure required parameters are included in request body
  const { error } = validatePostReservation(req.body);
  if (error) return res.status(400).send(errorResponse(400, error.details[0].message));


  const date = new Date(req.body.date);
  let today = new Date();

  const compDates = date.compareDate(today);
  if (compDates === -1 || (compDates === 0 && req.body.end < datetimeToNumberTime(today))) {
    return res.status(400).send(errorResponse(400, 'You may not make reservations for timeslots that have already passed.'))
  }

  const closeDate = new Date();
  closeDate.setMonth(9);
  closeDate.setDate(18);

  const datesTimeslots = await getTimeslotsForDate(date);
  const timeslots = datesTimeslots.filter(timeslot => 
    timeslot.start === req.body.start && 
    timeslot.end === req.body.end && 
    timeslot.type === req.body.type);

  if (timeslots.length === 0) {
    logInfo('Attempt to reserve non-existent timeslot', {body: req.body, timeslots: timeslots});
    return res.status(400).send(errorResponse(400, 'Timeslot with this start and end time does not exist.'))
  }

  const selectedTimeslot = timeslots[0]
  const familyType = selectedTimeslot.type === StringConstants.Schedule.Types.Family;

  // TODO : Find a configurable way to manage max reservations per week / day
  let maxPerWeek = familyType ? 3 : 4;
  let maxPerDay = familyType ? 1 : 2;
  let allowSameDay = true;

  // TODO : remove this garbage, make it configurable
  if (today.getMonth() === 4) {
    maxPerWeek = familyType ? 1 : 2;
    allowSameDay = false;
  }

  // end TODO

  const extraRes = familyType ? 0 : req.body.numberSwimmers - 1;
  const maxResPerSlot = selectedTimeslot.maxOccupants;

  // Check if the timeslots for this day are full
  const reservationsOnDay =  await calendar.getEventsForDateAndTime(date, date, req.body.start, req.body.end);
  const blockedTimeslot = reservationsOnDay.filter(event => event.description === "blocked");
  if (blockedTimeslot.length > 0)
    return res.status(400).send(errorResponse(400, `This timeslot is reserved for ${blockedTimeslot[0].summary}`));

  if (reservationsOnDay.length >= maxResPerSlot)
    return res.status(400).send(errorResponse(400, 'All slots have been reserved for the specified time.'));

  if (reservationsOnDay.length + extraRes >= maxResPerSlot)
    return res.status(400).send(errorResponse(400, `Unable to make ${extraRes + 1} reservations, that would exceed the maximum capacity for this timeslot`));

  if (req.body.type === 'lap' && req.body.numberSwimmers === 0)
    return res.status(400).send(errorResponse(400, 'You must specify the number of swimmers for lap reservations'));

  // Check if memberEmail was supplied. If not, check for session
  if (!req.body.memberEmail && !req.user)
    return res.status(400).send(errorResponse(400, 'User must be signed in to reserve a timeslot'));

  if (!req.body.memberEmail) req.body.memberEmail = req.user.email;

  let thisWeekEnd = getCurrentWeekEnd();
    
  // Check if reservation date is greater than end of this week
  if (!(isDevEnv() && req.user.isAdmin)) {
    if (today.getMonth() !== 9) {
      if (thisWeekEnd.compareDate(date) === -1)
        return res.status(400).send(errorResponse(400, 'You may not make reservations after this week (ending on Friday).'));
    }
    else if (closeDate.compareDate(date) === -1 || closeDate.compareDate(date) === 0) 
      return res.status(400).send(errorResponse(400, 'The season is over, reservations are no longer available. See you next year!'));
    
  }

  // Validate the parameter time values
  if (!validateTime(req.body.start) || !validateTime(req.body.end))
    return res.status(400).send(errorResponse(400,ValidationStrings.Validation.InvalidTime));
  
  //#region Business Logic for Creating Reservations
  const allMembers = await sheets.getAllMembers(false);
  const paidMembers = await sheets.getAllPaidMembersDict(true);

  // Check if member making reservation exists
  const members = allMembers.filter(member => 
    member.primaryEmail.toLowerCase() === req.body.memberEmail.toLowerCase() ||
    member.secondaryEmail.toLowerCase() === req.body.memberEmail.toLowerCase());

  if (members.length === 0) // Member does not exist
    return res.status(404).send(errorResponse(404,`Member with email ${req.body.memberEmail} not found.`));
  if (members.length > 1) // Somehow there are multiple members with this email
    return res.status(400).send(errorResponse(400,`Multiple members with email ${req.body.memberEmail} found`));

  const member = members[0];
  // Check if member has paid their dues
  if (!(member.id in paidMembers)) 
    return res.status(400).send(errorResponse(400,ValidationStrings.Reservation.PostDuesNotPaid.format(member.lastName)));

  // Check if member has already made max reservations for the week
  let weekStart = new Date(date);
  weekStart.setHours(0,0,0,0);
  let weekEnd = new Date(weekStart);

  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 1) % 7)); // weeks start on saturday, find begininning of week relative to date

  if (weekEnd.getDay() === 6) // weeks end on friday, find end of week relative to date
    weekEnd.setDate(weekEnd.getDate() + 6);
  else
    weekEnd.setDate(weekEnd.getDate() + 5 - weekEnd.getDay());

  // Query all events in week for current member
  const eventsForWeek = await calendar.getEventsForDateAndTime(weekStart, weekEnd, 0, 2359);
  const memberResWeek = eventsForWeek.filter(event => 
    (event.summary === member.certificateNumber || event.summary === `#${member.certificateNumber}`) && 
    event.description === req.body.type);

  if (!(isDevEnv() && req.user.isAdmin)) {
    let sameDayRes = memberResWeek.length === maxPerWeek && today.compareDate(date) === 0 && familyType;
    if (memberResWeek.length >= maxPerWeek && !(sameDayRes && allowSameDay)) {
      let sameDayUsed = (today.compareDate(date) === 0 && familyType && allowSameDay) ? ' And you have already used your same-day reservation for today.' : '';
      return res.status(400).send(errorResponse(400,ValidationStrings.Reservation.PostMaxReservationsMadeForWeek.format(maxPerWeek, req.body.type) + sameDayUsed));
    }
  }

  // If lap swimmer, and the extra reservation exceeds limit, send informative response
  if (!(isDevEnv() && req.user.isAdmin)) {
    if (memberResWeek.length + extraRes >= maxPerWeek && !familyType) 
      return res.status(400).send(errorResponse(400,`Unable to make ${extraRes + 1} reservations for ${date.toLocaleDateString()}, this would exceed your lap reservation limit for the week.`))
  
    // Check if member has already made a reservation for the given date
    const eventsForDate = await calendar.getEventsForDate(date);
    const memberResForDate = eventsForDate.filter(event => 
      (event.summary === member.certificateNumber || event.summary === `#${member.certificateNumber}`));
    const memberResForDateByType = memberResForDate.filter(event => event.description === req.body.type);

    if (memberResForDateByType.length >= maxPerDay)
      return res.status(400).send(errorResponse(400,ValidationStrings.Reservation.PostMaxReservationsMadeForDay.format(maxPerDay, req.body.type, date.toLocaleDateString())));

    // If lap swimmer, and the extra reservation exceeds limit, send informative response
    if (memberResForDateByType.length + extraRes >= maxPerDay && !familyType)
      return res.status(400).send(errorResponse(400,`Unable to make ${extraRes + 1} reservations for ${date.toLocaleDateString()}, this would exceed your lap reservation limit for the day.`))


    // Check if this reservation would sync up with any other reservations
    const backToBackRes = memberResForDate.filter(event => 
      datetimeToNumberTime(event.start.dateTime) === req.body.end ||
      datetimeToNumberTime(event.end.dateTime) === req.body.start);
    
    if (backToBackRes.length > 0)
      return res.status(400).send(errorResponse(400,`We are restricting back-to-back family to lap type reservations. For more information, contact the board of directors.`))
  }
  //#endregion

  // Create event and post it to the calendar
  const attendees = [req.user.email]

  const event = calendar.generateEvent(
    member.certificateNumber,
    req.body.location,
    req.body.type,
    date,
    date,
    req.body.start,
    req.body.end,
    attendees
  );

  try {
    let result;
    if (extraRes > 0) {
      const events = [];
      for (let i=0; i<=extraRes; i++) events.push(event);

      result = await calendar.postEventsToCalendar(events);
    }
    else 
      result = await calendar.postEventToCalendar(event);
    
    if (!result)
      return res.status(500).send(errorResponse(500,'Failed to post event to the calendar'));

    event.lastName = member.lastName;

    logInfo(`${req.user.email} made ${extraRes + 1} ${req.body.type} reservation(s) for ${date.toLocaleDateString()}, from ${req.body.start} to ${req.body.end}`);

    // sendEmail('Reservation Confirmation', emailBody(events), req.user.email);

    res.status(200).send(event);
  } catch (err) {
    logError(err, 'Error thrown while trying to post event to calendar');
    return res.status(500).send(errorResponse(500,'Error thrown while trying to post event to calendar'));
  }
});

function emailBody(events) {
  const numEvents = events.length;

  let body = `This is a confirmation that you have made the following swim club reservations\n\t`;

  for (let i=0; i<events.length; i++) {
    const start = new Date(events[i].start.dateTime);
    const end = new Date(events[i]);
    
    body += `${start.toLocaleDateString()} from ${start.toLocaleTimeString()} to ${end.toLocaleTimeString()}`;
  }

  return body;
}

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

  logInfo(`User ${req.user.email} removed event.`);
  res.status(200).send(result);
});

module.exports = router;