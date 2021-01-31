const express = require('express');
const router = express.Router();
const {admin} = require('../middleware/admin')
const {Schedule, validatePostSchedule, validatePutSchedule} = require('../models/schedule')
const {ValidationStrings} = require('../shared/strings');
const {errorResponse} = require('../shared/utility');
const {getValidDate} = require('../shared/validation')
const {logError, logInfo} = require('../debug/logging')
const {getTimeslotsForDate} = require('../shared/timeslots')
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
  
  const date = getValidDate(req.params.date);
  if (!date)
    return res.status(400).send(errorResponse(400, ValidationStrings.Schedules.InvalidDate.format(req.params.date)))

  const schedule = await Schedule.scheduleOn(date);

  return res.status(200).send(schedule)
})

router.get('/period/:date', async (req, res) => {
  if (!req.params.date)
    return res.status(400).send(errorResponse(400, ValidationStrings.Schedules.DateRequired))
  
  const date = getValidDate(req.params.date);
  if (!date)
    return res.status(400).send(errorResponse(400, ValidationStrings.Schedules.InvalidDate.format(req.params.date)))

  const schedules = await Schedule.schedulePeriod(date);

  return res.status(200).send(schedules)
})

router.get('/timeslots/:date', async (req, res) => {
  if (!req.params.date)
    return res.status(400).send(errorResponse(400, ValidationStrings.Schedules.DateRequired))
  
  const date = getValidDate(req.params.date);
  if (!date)
    return res.status(400).send(errorResponse(400, ValidationStrings.Schedules.InvalidDate.format(req.params.date)))

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

router.post('/array', [admin], async (req, res) => {
  if (!(req.body instanceof Array))
    return res.status(400).send(errorResponse(400, 'Request body must be an array'));
  
  const schedules = []
  for (let i=0; i<req.body.length; i++) {
    const currSchedule = req.body[i];
    
    const { error } = validatePostSchedule(currSchedule);
    if (error) return res.status(400).send(errorResponse(400, error.details[0].message));

    const startDate = new Date(currSchedule.startDate);
    startDate.setHours(0,0,0,0)
  
    if (currSchedule.day > 6 || currSchedule.day < 0)
      return res.status(400).send(errorResponse(400, ValidationStrings.Schedules.DayInvalid.format(currSchedule.day)))
  
    const query = await Schedule.find({
      day: currSchedule.day,
      startDate: startDate
    });
  
    if (query.length > 0) 
      return res.status(400).send(
        errorResponse(400, ValidationStrings.Schedules.ScheduleExists.format(
          currSchedule.day, 
          currSchedule.startDate)))
  
          currSchedule.startDate = startDate;
  
    const schedule = new Schedule(_.pick(currSchedule, 
      [
        'day',
        'startDate',
        'timeslots'
      ])
    );

    schedules.push(schedule);
  }

  failed = []
  success = []
  schedules.forEach(async (schedule) => {
    try {
      await schedule.save();
      success.push(schedule);
    } catch (err) {
      logError(err, 'Failed to add schedule to database')
      failed.push(schedule);
    }
  })

  if (failed.length > 0)
    return res.status(500).send(errorResponse(500, 'Failed to save all schedules to database'));
  
  return res.status(200).send(schedules)
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