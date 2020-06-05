const Joi = require("joi");
const mongoose = require("mongoose");
const {ValidationStrings} = require('../shared/strings');
Joi.objectId = require('joi-objectid')(Joi);

const dueSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.Number,
    ref: 'Member',
    required: true,
    immutable: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now()
  },
  check: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  membershipYear: {
    type: Number,
    required: true
  }
},
{
  timestamps: true
});


// Year validation function
// Arbitrarily, we accept payments up to a year in advance, and reject payments 5 years later. This can/should change
function validateYear(year) 
{
  const thisYear = (new Date()).getFullYear();
  if (thisYear + 1 > year && year > thisYear - 5)
    return true;
  return false;
}

dueSchema.path('membershipYear').validate(validateYear, ValidationStrings.Due.InvalidMembershipYear);

const Due = mongoose.model("Due", dueSchema);

// Validates a /POST request
function validatePostDue(due) {
  const schema = {
    member: Joi.number().required(),
    date: Joi.date().optional(),
    amount: Joi.number().required(),
    check: Joi.string().required(),
    membershipYear: Joi.number().required()
  };

  return Joi.validate(due, schema);
}

// Validates a /PUT request
function validatePutDue(due) {
  const schema = {
    date: Joi.date(),
    amount: Joi.number(),
    check: Joi.string(),
    membershipYear: Joi.number()
  };

  return Joi.validate(due, schema);
}


module.exports.Due = Due;
module.exports.validatePostDue = validatePostDue;
module.exports.validatePutDue = validatePutDue;