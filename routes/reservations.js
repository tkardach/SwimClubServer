require('../shared/extensions');
const {checkAdmin} = require('../middleware/admin');
const Joi = require("joi");
const express = require('express');
const router = express.Router();
const {ValidationStrings, StringConstants} = require('../shared/strings');
const {validateTime} = require('../shared/validation');
const calendar = require('../modules/google/calendar');
const sheets = require('../modules/google/sheets');
const _ = require('lodash');
const { logError } = require('../debug/logging');
const {errorResponse, datetimeToNumberTime} = require('../shared/utility');
const {getTimeslotsForDate} = require('../shared/timeslots')
const path = require('path');


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
    numberSwimmers: Joi.number().optional()
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

  const datesTimeslots = await getTimeslotsForDate(date);
  const timeslots = datesTimeslots.filter(timeslot => 
    timeslot.start === req.body.start && 
    timeslot.end === req.body.end && 
    timeslot.type === req.body.type);

  if (timeslots.length === 0) 
    return res.status(400).send(errorResponse(400, 'Timeslot with this start and end time does not exist.'))

  const selectedTimeslot = timeslots[0]
  const familyType = selectedTimeslot.type === StringConstants.Schedule.Types.Family;
  const maxPerWeek = familyType ? 2 : 4;
  const maxPerDay = familyType ? 1 : 2;

  const extraRes = familyType ? 0 : req.body.numberSwimmers - 1;
  const maxResPerSlot = selectedTimeslot.maxOccupants;

  // Check if the timeslots for this day are full
  const reservationsOnDay =  await calendar.getEventsForDateAndTime(date, date, req.body.start, req.body.end);
  const blockedTimeslot = reservationsOnDay.filter(event => event.description === "blocked");
  if (blockedTimeslot.length > 0)
    return res.status(400).send(errorResponse(400, `This timeslot is reserved for ${blockedTimeslot[0].summary}`));

  if (reservationsOnDay.length >= maxResPerSlot)
    return res.status(400).send(errorResponse(400, 'All slots have been reserved for the specified time.'));

  if (req.body.type === 'lap' && req.body.numberSwimmers === 0)
    return res.status(400).send(errorResponse(400, 'You must specify the number of swimmers for lap reservations'));

  // Check if memberEmail was supplied. If not, check for session
  if (!req.body.memberEmail && !req.user)
    return res.status(400).send(errorResponse(400, 'User must be signed in to reserve a timeslot'));

  if (!req.body.memberEmail) req.body.memberEmail = req.user.email;

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

  let today = new Date();
  let sameDayRes = memberResWeek.length === maxPerWeek && today.compareDate(date) === 0 && familyType;
  if (memberResWeek.length >= maxPerWeek && !sameDayRes) {
    let sameDayUsed = today.compareDate(date) === 0 && familyType ? ' And you have already used your same-day reservation for today.' : '';
    return res.status(400).send(errorResponse(400,ValidationStrings.Reservation.PostMaxReservationsMadeForWeek.format(maxPerWeek, req.body.type) + sameDayUsed));
  }

  // If lap swimmer, and the extra reservation exceeds limit, send informative response
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


  if (reservationsOnDay.length + extraRes >= maxResPerSlot)
    return res.status(400).send(errorResponse(400, `Unable to make ${extraRes + 1} reservations, that would exceed the maximum capacity for this timeslot`));
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