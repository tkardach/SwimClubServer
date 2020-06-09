const Joi = require("joi");
const mongoose = require("mongoose");
Joi.objectId = require('joi-objectid')(Joi);
const {ValidationStrings} = require('../shared/strings');
const {validateTime} = require('../shared/validation');

const WeekdayEnum = {
  SUNDAY:     1,
  MONDAY:     2,
  TUESDAY:    4,
  WEDNESDAY:  8,
  THURSDAY:   16,
  FRIDAY:     32,
  SATURDAY:   64
};

/**
 *  Returns the open and closed weekdays according to the mask number
 *  @param {weekdays} weekdays - number mask containing the open and closed weekdays (0-closed, 1-open)
 */
function getWeekdayMask(weekdays) {
  return {
    monday: (weekdays & WeekdayEnum.MONDAY) != 0,
    tuesday: (weekdays & WeekdayEnum.TUESDAY)  != 0,
    wednesday: (weekdays & WeekdayEnum.WEDNESDAY)  != 0,
    thursday: (weekdays & WeekdayEnum.THURSDAY)  != 0,
    friday: (weekdays & WeekdayEnum.FRIDAY)  != 0,
    saturday: (weekdays & WeekdayEnum.SATURDAY)  != 0,
    sunday: (weekdays & WeekdayEnum.SUNDAY)  != 0
  };
}

const scheduleSchema = new mongoose.Schema({
  weekdays: {
    type: Number,
    required: true
  },
  start: {
    type: Date,
    required: true
  },
  end: {
    type: Date,
    required: true
  },
  startTime: {
    type: Number,
    required: true
  },
  endTime: {
    type: Number,
    required: true
  }
},
{ timestamps: true });

scheduleSchema.path('startTime').validate(validateTime, ValidationStrings.Validation.InvalidTime);
scheduleSchema.path('endTime').validate(validateTime, ValidationStrings.Validation.InvalidTime);


const Schedule = mongoose.model("Schedule", scheduleSchema);

// Validates a /POST request
function validatePostSchedule(schedule) {
  const schema = {
    weekdays: Joi.number(),
    start: Joi.date().required(),
    end: Joi.date().required(),
    startTime: Joi.number().required(),
    endTime: Joi.number().required()
  };

  return Joi.validate(schedule, schema);
}

// Validates a /PUT request
function validatePutSchedule(schedule) {
  const schema = {
    weekdays: Joi.number(),
    start: Joi.date(),
    end: Joi.date(),
    startTime: Joi.number(),
    endTime: Joi.number()
  };

  return Joi.validate(schedule, schema);
}

module.exports.getWeekdayMask = getWeekdayMask;
module.exports.Schedule = Schedule;
module.exports.validatePostSchedule = validatePostSchedule;
module.exports.validatePutSchedule = validatePutSchedule;