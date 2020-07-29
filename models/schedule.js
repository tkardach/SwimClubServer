const Joi = require("joi");
const mongoose = require("mongoose");
const {StringConstants} = require('../shared/strings')
Joi.objectId = require('joi-objectid')(Joi);


const TimeslotTypeEnum = [
  StringConstants.Schedule.Types.Family, 
  StringConstants.Schedule.Types.Lap, 
  StringConstants.Schedule.Types.Lessons,
  StringConstants.Schedule.Types.Blocked
];

const scheduleSchema = new mongoose.Schema({
  day: {type: Number, required: true},
  timeslots: [{
    type: {
      type: String,
      enum: TimeslotTypeEnum,
      required: true
    },
    start: {
      type: Number,
      required: true
    },
    end: {
      type: Number,
      required: true
    },
    maxOccupants: {
      type: Number,
      required: true
    }
  }],
  startDate: {type: Date, required: true}
},
{ timestamps: true });


scheduleSchema.statics.currentSchedule = function() {
  let today = new Date()

  return this
    .find()
    .sort('-startDate')
    .distinct('day')
    .where('startDate').lte(today);
}

scheduleSchema.statics.scheduleOn = function(paramDate) {
  let date = new Date(paramDate)
  return this
    .findOne()
    .sort('-startDate')
    .where('startDate').lte(date)
    .where('day').equals(date.getDay());
}

scheduleSchema.statics.schedulePeriod = function(paramDate) {
  let date = new Date(paramDate)
  return this
    .aggregate([
      { $match: { startDate: { $lte: date } } },
      { $sort: { startDate: -1 } },
      { $group: {
          _id: '$day',                 
          firstId: { '$first': '$_id' },
          startDate: { '$first': '$startDate' },
          timeslots: { '$first': '$timeslots' }
        } 
      }, 
      { $project: { 
          'day': {
            $cond: [
              { $eq: ['$firstId', '$_id'] },
              null,
              '$_id'
            ]
          },
          '_id': '$firstId',
          startDate: '$startDate',
          timeslots: '$timeslots'
        }
      }
    ]);
}

const Schedule = mongoose.model("Schedule", scheduleSchema);

// Validates a /POST request
function validatePostSchedule(schedule) {
  const schema = {
    day: Joi.number().required(),
    timeslots: Joi.array().items(
      Joi.object({
        type: Joi.string().valid(...TimeslotTypeEnum).required(),
        start: Joi.number().required(),
        end: Joi.number().required(),
        maxOccupants: Joi.number().required()
      }).allow(null).allow('')
    ).allow(null).allow(''),
    startDate: Joi.date().required()
  };

  return Joi.validate(schedule, schema);
}

// Validates a /PUT request
function validatePutSchedule(schedule) {
  const schema = {
    day: Joi.number(),
    timeslots: Joi.array().items(
      Joi.object({
        type: Joi.string().valid(...TimeslotTypeEnum),
        start: Joi.number(),
        end: Joi.number(),
        maxOccupants: Joi.number()
      })
    ),
    startDate: Joi.date()
  };

  return Joi.validate(schedule, schema);
}

module.exports.Schedule = Schedule;
module.exports.validatePostSchedule = validatePostSchedule;
module.exports.validatePutSchedule = validatePutSchedule;