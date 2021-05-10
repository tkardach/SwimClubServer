const {Schedule} = require('../models/schedule');
const calendar = require('../modules/google/calendar')
const {datetimeToNumberTime} = require('../shared/utility');
const {StringConstants} = require('../shared/strings')
require('./extensions');


const WEEK_END_DAY = 5;
const RESERVATION_START_TIME = 18;
const RESERVATION_START_DAY = 4;


async function getTimeslotsForDate(targetDate) {
  let date = new Date(targetDate);
  let today = new Date();
  let weekEnd = getCurrentWeekEnd();

  const schedule = await Schedule.scheduleOn(date).lean();

  if (!schedule || date.compareDate(today) === -1)
    return [];

  let timeslots = schedule.timeslots;

  const eventsOnDate = await calendar.getEventsForDate(date);

  timeslots.forEach(function(timeslot) {
    timeslot.vacant = true
    
    // Find all events matching this start and end time
    let filtered = eventsOnDate.filter(event => 
      event.start !== undefined &&
      event.end !== undefined &&
      datetimeToNumberTime(event.start.dateTime) == timeslot.start &&
      datetimeToNumberTime(event.end.dateTime) == timeslot.end)

    // Find all blocking events within this range
    let blocked = eventsOnDate.filter(event => 
      event.start !== undefined &&
      event.end !== undefined &&
      event.description === StringConstants.Schedule.Types.Blocked &&
      (datetimeToNumberTime(event.start.dateTime) <= timeslot.start && 
      datetimeToNumberTime(event.end.dateTime) >= timeslot.end))

    // Set vacant to false if any of the given restrictions apply
    if (filtered.length >= timeslot.maxOccupants || 
        blocked.length > 0 ||
        timeslot.type === StringConstants.Schedule.Types.Blocked ||
        timeslot.type === StringConstants.Schedule.Types.Lessons ||
        weekEnd.compareDate(date) === -1)
      timeslot.vacant = false
  })

  return timeslots;
}

function getCurrentWeekEnd() {
  let thisWeekEnd = new Date();
  let now = new Date();
  let offset = 0;
  
  if (now.getDay() >= RESERVATION_START_DAY && now.getHours() >= RESERVATION_START_TIME)
    offset = 7;

  if (now.getDay() === WEEK_END_DAY) // find end of week relative to date
    thisWeekEnd.setDate(now.getDate() + 7 + offset);
  else
    thisWeekEnd.setDate(now.getDate() + WEEK_END_DAY - now.getDay() + offset);

  return thisWeekEnd;
}

function getTimeslotConfiguration() {
  return {
    weekEnd: WEEK_END_DAY,
    resStartTime: RESERVATION_START_TIME,
    resStartDay: RESERVATION_START_DAY
  }
}

module.exports.getTimeslotsForDate = getTimeslotsForDate;
module.exports.getTimeslotConfiguration = getTimeslotConfiguration;
module.exports.getCurrentWeekEnd = getCurrentWeekEnd;