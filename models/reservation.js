/**
 *  Defines the database model for a reservation
 */

require('../shared/extensions');
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
  start: {
    type: Number,
    required: true
  },
  end: {
    type: Number,
    required: true
  }
}, 
{
  timestamps: true
});

reservationSchema.statics.reservationsOnDate = function(date) {
  let target = new Date(date);
  let startTarget = new Date(target);
  startTarget.setHours(0,0,0,0);
  let endTarget = new Date(target);
  endTarget.setDate(startTarget.getDate() + 1);

  return this
    .find()
    .where('date').gte(startTarget).lt(endTarget);
}

// Make sure the reservation date is equal or later than today's date
function validateReservationDate(date) {
  return date.compareDate(new Date()) >= 0;
}

reservationSchema.path('date').validate(validateReservationDate, ValidationStrings.Reservation.InvalidReservationDate);

reservationSchema.path('start').validate(validateTime, ValidationStrings.Validation.InvalidTime);
reservationSchema.path('end').validate(validateTime, ValidationStrings.Validation.InvalidTime);

const Reservation = mongoose.model("Reservation", reservationSchema);

// Validates a /POST request
function validatePostReservation(res) {
  const schema = {
    member: Joi.string().optional(),
    date: Joi.date().required(),
    start: Joi.number().required(),
    end: Joi.number().required()
  };

  return Joi.validate(res, schema);
}

// Validates a /PUT request
function validatePutReservation(res) {
  const schema = {
    member: Joi.string().allow('').optional(),
    date: Joi.date().optional(),
    start: Joi.number().optional(),
    end: Joi.number().optional()
  };

  return Joi.validate(res, schema);
}


module.exports.Reservation = Reservation;
module.exports.validatePostReservation = validatePostReservation;
module.exports.validatePutReservation = validatePutReservation;