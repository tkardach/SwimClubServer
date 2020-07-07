const Joi = require("joi");
const mongoose = require("mongoose");
Joi.objectId = require('joi-objectid')(Joi);


const TimeslotTypeEnum = ["family", "lap"];

const scheduleSchema = new mongoose.Schema({
  name: {type: String, required: true},
  active: {type: Boolean, required: true},
  weekdays: [{
    day: {type: Number, required: true},
    timeslots: [{type: mongoose.Schema.Types.ObjectId, ref: 'Timeslot'}]
  }]
},
{ timestamps: true });

const Schedule = mongoose.model("Schedule", scheduleSchema);

// Validates a /POST request
function validatePostSchedule(schedule) {
  const schema = {
    name: Joi.string().required(),
    active: Joi.boolean().required(),
    weekdays: Joi.array().items(
      Joi.object({
        day: Joi.number().required(),
        timeslots: Joi.array().items(
          Joi.object({
            type: Joi.string().valid(...TimeslotTypeEnum).required(),
            start: Joi.number().required(),
            end: Joi.number().required()
          })
        ).optional()
      })
    )
  };

  return Joi.validate(schedule, schema);
}

// Validates a /PUT request
function validatePutSchedule(schedule) {
  const schema = {
    name: Joi.string(),
    active: Joi.boolean(),
    weekdays: Joi.array().items(
      Joi.object({
        day: Joi.number(),
        timeslots: Joi.array().items(
          Joi.object({
            type: Joi.string().valid(...TimeslotTypeEnum).required(),
            start: Joi.number().required(),
            end: Joi.number().required()
          })
        ).optional()
      })
    )
  };

  return Joi.validate(schedule, schema);
}

module.exports.Schedule = Schedule;
module.exports.validatePostSchedule = validatePostSchedule;
module.exports.validatePutSchedule = validatePutSchedule;