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

reservationSchema.statics.reservationsInRange = function(date, start, finish) {
  return this
    .reservationsOnDate()
    .where('startTime').lte(start)
    .where('endTime').gte(finish);
}

reservationSchema.path('startTime').validate(validateTime, ValidationStrings.Validation.InvalidTime);
reservationSchema.path('endTime').validate(validateTime, ValidationStrings.Validation.InvalidTime);

// Make sure the reservation date is equal or later than today's date
function validateReservationDate(date) {
  return date.compareDate(new Date()) >= 0;
}

reservationSchema.path('date').validate(validateReservationDate, ValidationStrings.Reservation.InvalidReservationDate);

const Reservation = mongoose.model("Reservation", reservationSchema);

// Validates a /POST request
function validatePostReservation(res) {
  const schema = {
    member: Joi.string().optional(),
    date: Joi.date().required(),
    startTime: Joi.date().required(),
    endTime: Joi.date().required()
  };

  return Joi.validate(res, schema);
}

// Validates a /PUT request
function validatePutReservation(res) {
  const schema = {
    member: Joi.string().allow('').optional(),
    date: Joi.date().optional(),
    startTime: Joi.date().optional(),
    endTime: Joi.date().optional()
  };

  return Joi.validate(res, schema);
}


module.exports.Reservation = Reservation;
module.exports.validatePostReservation = validatePostReservation;
module.exports.validatePutReservation = validatePutReservation;