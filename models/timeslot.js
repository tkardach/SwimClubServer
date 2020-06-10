const Joi = require("joi");
const mongoose = require("mongoose");
const {ValidationStrings} = require('../shared/strings');
const {validateTime} = require('../shared/validation');

const timeslotSchema = new mongoose.Schema({
  startTime: {
    type: Number,
    required: true
  },
  endTime: {
    type: Number,
    required: true
  }
});

timeslotSchema.statics.byRange = function(start, end) {
  return this
    .find()
    .where('startTime').equals(start)
    .where('endTime').equals(end);
}

timeslotSchema.path('startTime').validate(validateTime, ValidationStrings.Validation.InvalidTime);
timeslotSchema.path('endTime').validate(validateTime, ValidationStrings.Validation.InvalidTime);

const Timeslot = mongoose.model("Timeslot", timeslotSchema);

// Validates a /POST request
function validatePostTimeslot(slot) {
  const schema = {
    startTime: Joi.number().required(),
    endTime: Joi.number().required()
  };

  return Joi.validate(slot, schema);
}

// Validates a /PUT request
function validatePutTimeslot(slot) {
  const schema = {
    startTime: Joi.number().optional(),
    endTime: Joi.number().optional()
  };

  return Joi.validate(slot, schema);
}


module.exports.Timeslot = Timeslot;
module.exports.validatePostTimeslot = validatePostTimeslot;
module.exports.validatePutTimeslot = validatePutTimeslot;