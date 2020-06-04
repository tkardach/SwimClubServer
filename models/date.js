const Joi = require("joi");
const mongoose = require("mongoose");
Joi.objectId = require('joi-objectid')(Joi);

const dateSchema = new mongoose.Schema({
  weekday: {
    type: String
  },
  date: {
    type: Date,
    required: true
  },
  openTime: Date,
  closeTime: Date,
  open : {
    type: Boolean,
    required: true
  },
  reservations: [{type: mongoose.Schema.Types.ObjectId, ref: 'Reservation'}]
});

const DateModel = mongoose.model("DateModel", dateSchema);

// Validates a /POST request
function validatePostDate(date) {
  const schema = {
    weekday: Joi.string(),
    date: Joi.date().required(),
    openTime: Joi.date(),
    closeTime: Joi.date(),
    open: Joi.boolean().required()
  };

  return Joi.validate(date, schema);
}

// Validates a /PUT request
function validatePutDate(date) {
  const schema = {
    weekday: Joi.string(),
    date: Joi.date(),
    openTime: Joi.date(),
    closeTime: Joi.date(),
    open: Joi.boolean()
  };

  return Joi.validate(date, schema);
}


module.exports.DateModel = DateModel;
module.exports.validatePostDate = validatePostDate;
module.exports.validatePutDate = validatePutDate;