const Joi = require("joi");
const mongoose = require("mongoose");
Joi.objectId = require('joi-objectid')(Joi);


const TimeslotTypeEnum = ["family", "lap"];

const timeslotSchema = new mongoose.Schema({
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
  }
},
{ timestamps: true });

const Timeslot = mongoose.model("Timeslot", timeslotSchema);

// Validates a /POST request
function validatePostTimeslot(timeslot) {
  const schema = {
  };

  return Joi.validate(timeslot, schema);
}

// Validates a /PUT request
function validatePutTimeslot(timeslot) {
  const schema = {
  };

  return Joi.validate(timeslot, schema);
}

module.exports.Timeslot = Timeslot;
module.exports.validatePostTimeslot = validatePostTimeslot;
module.exports.validatePutTimeslot = validatePutTimeslot;