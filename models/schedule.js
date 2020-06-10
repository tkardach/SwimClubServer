require('../shared/extensions');
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

function getMask(open) {
  return {
    sunday: open,
    monday: open,
    tuesday: open,
    wednesday: open,
    thursday: open,
    friday: open,
    saturday: open
  };
}

/**
 *  Returns the open and closed weekdays according to the mask number
 *  @param {weekdays} weekdays - number mask containing the open and closed weekdays (0-closed, 1-open)
 */
function getWeekdayMaskFromNumber(weekdays) {
  return {
    sunday: (weekdays & WeekdayEnum.SUNDAY)  != 0,
    monday: (weekdays & WeekdayEnum.MONDAY) != 0,
    tuesday: (weekdays & WeekdayEnum.TUESDAY)  != 0,
    wednesday: (weekdays & WeekdayEnum.WEDNESDAY)  != 0,
    thursday: (weekdays & WeekdayEnum.THURSDAY)  != 0,
    friday: (weekdays & WeekdayEnum.FRIDAY)  != 0,
    saturday: (weekdays & WeekdayEnum.SATURDAY)  != 0
  };
}

/**
 *  Returns the number from the weekday mask
 *  @param {mask} mask - weekday mask to convert to number
 */
function getNumberFromWeekdayMask(mask) {
  return (mask.sunday ? WeekdayEnum.SUNDAY : 0) |
         (mask.monday ? WeekdayEnum.MONDAY : 0) |
         (mask.tuesday ? WeekdayEnum.TUESDAY : 0) |
         (mask.wednesday ? WeekdayEnum.WEDNESDAY : 0) |
         (mask.thursday ? WeekdayEnum.THURSDAY : 0) |
         (mask.friday ? WeekdayEnum.FRIDAY : 0) |
         (mask.saturday ? WeekdayEnum.SATURDAY : 0);
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
  },
  timeslots: [{type: mongoose.Schema.Types.ObjectId, ref: 'Timeslot'}],
  maxReservations: Number
},
{ timestamps: true });

scheduleSchema.statics.byDate = function(date) {
  const today = new Date(date);
  today.setHours(0,0,0,0);
  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0,0,0,0);

  return this
    .findOne()
    .where('start').lt(tomorrow)
    .where('end').gte(today)
    .sort({'createdAt': -1});
}

scheduleSchema.statics.getCurrent = function() {
  const today = new Date();
  today.setHours(0,0,0,0);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0,0,0,0);

  return this
    .findOne()
    .where('start').lt(tomorrow)
    .where('end').gte(today)
    .sort({'createdAt': -1});
}

scheduleSchema.path('startTime').validate(validateTime, ValidationStrings.Validation.InvalidTime);
scheduleSchema.path('endTime').validate(validateTime, ValidationStrings.Validation.InvalidTime);

scheduleSchema.methods.getWeekdayMask = function() {
  return getWeekdayMaskFromNumber(this.weekdays);
}

scheduleSchema.methods.isOpenOnDate = function(date) {
  const mask = this.getWeekdayMask();
  const target = new Date(date);
  
  // If invalid format, return false
  if (isNaN(target))  return false;

  // If date is outside of schedule range, return false
  let compStart = target.compareDate(this.start);
  let compEnd = target.compareDate(this.end);
  if (compStart < 0 || compEnd > 0) return false;

  // If closed on specific weekday, return false
  switch (target.getDay()) {
    case 0: // sunday
      return mask.sunday;
    case 1: // monday
      return mask.monday;
    case 2: // tuesday
      return mask.tuesday;
    case 3: // wednesday
      return mask.wednesday;
    case 4: // thursay
      return mask.thursday;
    case 5: // friday
      return mask.friday;
    case 6: // saturday
      return mask.saturday;
    default:
      return false;
  }
}

scheduleSchema.methods.isOpenDuringTime = function(time) {
  // If time is outside of open hours, return false
  return time >= this.startTime && time <= this.endTime;
}

const Schedule = mongoose.model("Schedule", scheduleSchema);

// Validates a /POST request
function validatePostSchedule(schedule) {
  const schema = {
    weekdays: Joi.number(),
    timeslots: Joi.array().items(
      Joi.object({
        startTime: Joi.number(),
        endTime: Joi.number()
      })
    ).optional(),
    maxReservations: Joi.number(),
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
    timeslots: Joi.array().items(
      Joi.object({
        startTime: Joi.number(),
        endTime: Joi.number()
      })
    ).optional(),
    maxReservations: Joi.number(),
    start: Joi.date(),
    end: Joi.date(),
    startTime: Joi.number(),
    endTime: Joi.number()
  };

  return Joi.validate(schedule, schema);
}

module.exports.getMask = getMask;
module.exports.getNumberFromWeekdayMask = getNumberFromWeekdayMask;
module.exports.getWeekdayMaskFromNumber = getWeekdayMaskFromNumber;

module.exports.Schedule = Schedule;
module.exports.validatePostSchedule = validatePostSchedule;
module.exports.validatePutSchedule = validatePutSchedule;