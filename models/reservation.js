/**
 *  Defines the database model for a reservation
 */

const Joi = require("joi");
const mongoose = require("mongoose");
Joi.objectId = require('joi-objectid')(Joi);

const reservationSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.Number,
    ref: 'Member'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  }
}, 
{
  timestamps: true
});

const Reservation = mongoose.model("Reservation", reservationSchema);

// Validates a /POST request
function validatePostReservation(res) {
  const schema = {
    member: Joi.objectId().optional(),
    startTime: Joi.date().required(),
    endTime: Joi.date().required()
  };

  return Joi.validate(res, schema);
}

// Validates a /PUT request
function validatePutReservation(res) {
  const schema = {
    member: Joi.objectId().allow('').optional(),
    startTime: Joi.date().optional(),
    endTime: Joi.date().optional()
  };

  return Joi.validate(res, schema);
}


module.exports.Reservation = Reservation;
module.exports.validatePostReservation = validatePostReservation;
module.exports.validatePutReservation = validatePutReservation;