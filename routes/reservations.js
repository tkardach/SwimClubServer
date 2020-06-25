require('../shared/extensions');
const {auth, checkAuth} = require('../middleware/auth');
const {admin, checkAdmin} = require('../middleware/admin');
const Joi = require("joi");
const express = require('express');
const router = express.Router();
const validateObjectId = require('../middleware/validateObjectId');
const {ValidationStrings} = require('../shared/strings');
const {validateTime} = require('../shared/validation');
const calendar = require('../modules/calendar');
const _ = require('lodash');
const { logError } = require('../debug/logging');


// Validates a /POST request
function validatePostReservation(res) {
  const schema = {
    summary: Joi.string().required(),
    location: Joi.string().optional(),
    description: Joi.string().optional(),
    date: Joi.date().required(),
    start: Joi.number().required(),
    end: Joi.number().required(),
    attendees: Joi.array().items(Joi.string()).optional()
  };

  return Joi.validate(res, schema);
}

router.get('/', [checkAuth, checkAdmin], async (req, res) => {
});

router.post('/', async (req, res) => {
  const { error } = validatePostReservation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const date = new Date(req.body.date);

  if (!validateTime(req.body.start) || !validateTime(req.body.end))
    return res.status(400).send(ValidationStrings.Validation.InvalidTime);
  
  const event = calendar.generateEvent(
    req.body.summary,
    req.body.location,
    req.body.description,
    req.body.date,
    req.body.date,
    req.body.start,
    req.body.end,
    req.body.attendees
  );

  try {
    const result = await calendar.postEventToCalendar(event);
    if (!result)
      res.status(500).send('Failed to post event to the calendar');
    else
      res.status(200).send(result);
  } catch (err) {
    logError(err, 'Failed to post event to calendar');
    return res.status(500).send('Failed to post event to the calendar');
  }
});

router.put('/:id', [checkAuth, checkAdmin], async (req, res) => {
});

router.delete('/:id', validateObjectId, async (req, res) => {
  res.status(200).send("This feature is currently under development");
});

module.exports = router;