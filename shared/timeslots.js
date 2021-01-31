const {Schedule} = require('../models/schedule');
const calendar = require('../modules/google/calendar')
const {datetimeToNumberTime} = require('../shared/utility');
const {StringConstants} = require('../shared/strings')
require('./extensions');


async function getTimeslotsForDate(targetDate) {
  let date = new Date(targetDate);
  let today = new Date();

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
        timeslot.type === StringConstants.Schedule.Types.Lessons)
      timeslot.vacant = false
  })

  return timeslots;
}

module.exports.getTimeslotsForDate = getTimeslotsForDate;