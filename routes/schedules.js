const express = require('express');
const router = express.Router();
const {admin, checkAdmin} = require('../middleware/admin')
const {Schedule, validatePostSchedule, validatePutSchedule} = require('../models/schedule')
const {ValidationStrings} = require('../shared/strings');
const {errorResponse} = require('../shared/utility');
const {isValidDate} = require('../shared/validation')
const {logError, logInfo} = require('../debug/logging')
const {getTimeslotsForDate} = require('../shared/timeslots')
const calendar = require('../modules/google/calendar')
const _ = require('lodash');
const validateObjectId = require('../middleware/validateObjectId');



router.get('/', async (req, res) => {
  const schedules = await Schedule.find();
  return res.status(200).send(schedules)
})

router.get('/current', async (req, res) => {
  const schedules = await Schedule.currentSchedule();
  return res.status(200).send(schedules)
})

router.get('/date/:date', async (req, res) => {
  if (!req.params.date)
    return res.status(400).send(errorResponse(400, ValidationStrings.Schedules.DateRequired))
  
  if (!isValidDate(req.params.date))
    return res.status(400).send(errorResponse(400, ValidationStrings.Schedules.InvalidDate.format(req.params.date)))

  const schedule = await Schedule.scheduleOn(req.params.date);

  return res.status(200).send(schedule)
})

router.get('/period/:date', async (req, res) => {
  if (!req.params.date)
    return res.status(400).send(errorResponse(400, ValidationStrings.Schedules.DateRequired))
  
  if (!isValidDate(req.params.date))
    return res.status(400).send(errorResponse(400, ValidationStrings.Schedules.InvalidDate.format(req.params.date)))

  const schedules = await Schedule.schedulePeriod(req.params.date);

  return res.status(200).send(schedules)
})

router.get('/timeslots/:date', async (req, res) => {
  if (!req.params.date)
    return res.status(400).send(errorResponse(400, ValidationStrings.Schedules.DateRequired))
  
  if (!isValidDate(req.params.date))
    return res.status(400).send(errorResponse(400, ValidationStrings.Schedules.InvalidDate.format(req.params.date)))

  let date = new Date(req.params.date)
  const timeslots = await getTimeslotsForDate(date)

  return res.status(200).send(timeslots)
})

router.post('/', [admin], async (req, res) => {
  const { error } = validatePostSchedule(req.body);
  if (error) return res.status(400).send(errorResponse(400, error.details[0].message));

  const startDate = new Date(req.body.startDate);
  startDate.setHours(0,0,0,0)

  if (req.body.day > 6 || req.body.day < 0)
    return res.status(400).send(errorResponse(400, ValidationStrings.Schedules.DayInvalid.format(req.body.day)))

  const query = await Schedule.find({
    day: req.body.day,
    startDate: startDate
  });

  if (query.length > 0) 
    return res.status(400).send(
      errorResponse(400, ValidationStrings.Schedules.ScheduleExists.format(
        req.body.day, 
        req.body.startDate)))

  req.body.startDate = startDate;

  const schedule = new Schedule(_.pick(req.body, 
    [
      'day',
      'startDate',
      'timeslots'
    ])
  );

  try {
    await schedule.save();
    return res.status(200).send(schedule)
  } catch (err) {
    logError(err, 'Failed to add schedule to database')
    return res.status(500).send(errorResponse(500, 'Error occured when adding schedule to database'))
  }
})

router.put('/:id', [admin, validateObjectId], async (req, res) => {
  const { error } = validatePutSchedule(req.body);
  if (error) 
    return res.status(400).send(errorResponse(400, error.details[0].message))

  const schedule = await Schedule.findByIdAndUpdate(req.params.id, 
    {
      $set: _.pick(req.body,
        [
          'day',
          'startDate',
          'timeslots'
        ])
    }, { new: true });

  if (!schedule) 
    return res.status(404).send(errorResponse(404, ValidationStrings.Schedules.ScheduleDoesNotExist))

  return res.status(200).send(schedule)
})

router.delete('/:id', [admin, validateObjectId], async (req, res) => {
  const schedule = await Schedule.findByIdAndDelete(req.params.id);

  if (!schedule) return res.status(404).send(errorResponse(404, ValidationStrings.Schedules.ScheduleDoesNotExist))

  logInfo(`Schedule removed: ${schedule}`);

  return res.status(200).send(schedule);
})

module.exports = router;