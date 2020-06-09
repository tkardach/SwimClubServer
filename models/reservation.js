/**
 *  Defines the database model for a reservation
 */

const Joi = require("joi");
const mongoose = require("mongoose");
Joi.objectId = require('joi-objectid')(Joi);
const {ValidationStrings} = require('../shared/strings');
const {validateTime} = require('../shared/validation');

const reservationSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.String,
    ref: 'Member',
    default: ValidationStrings.Reservation.EmptyReservation
  },
  date: {
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
{
  timestamps: true
});

reservationSchema.path('startTime').validate(validateTime, ValidationStrings.Validation.InvalidTime);
reservationSchema.path('endTime').validate(validateTime, ValidationStrings.Validation.InvalidTime);

const Reservation = mongoose.model("Reservation", reservationSchema);

// Validates a /POST request
function validatePostReservation(res) {
  const schema = {
    member: Joi.objectId().optional(),
    date: Joi.date().required(),
    startTime: Joi.date().required(),
    endTime: Joi.date().required()
  };

  return Joi.validate(res, schema);
}

// Validates a /PUT request
function validatePutReservation(res) {
  const schema = {
    member: Joi.objectId().allow('').optional(),
    date: Joi.date().optional(),
    startTime: Joi.date().optional(),
    endTime: Joi.date().optional()
  };

  return Joi.validate(res, schema);
}


module.exports.Reservation = Reservation;
module.exports.validatePostReservation = validatePostReservation;
module.exports.validatePutReservation = validatePutReservation;