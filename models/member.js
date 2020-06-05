/**
 *  Defines the database model for a member
 */

const Joi = require('joi');
const mongoose = require('mongoose');
const {ValidationStrings} = require("../shared/strings");
Joi.objectId = require('joi-objectid')(Joi);

const MemberTypeEnum = ["BD","PL","PM","CL","BE","TR","LE","CO","SL"];

const memberSchema = new mongoose.Schema({
  _id: { type: Number },
  certificateNumber: {
    type: Number,
    required: true,
    unique: true,
    immutable: true
  },
  lastName: { 
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: MemberTypeEnum,
    required: true
  },
  salutation: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  zip: {
    type: String,
    required: true
  },
  primaryPhone: {
    type: String,
    required: true
  },
  secondaryPhone: String,
  primaryEmail: {
    type: String,
    required: true
  },
  secondaryEmail: String,
  director: {
    type: Boolean,
    default: false
  },
  dirEmail: String,
  dirName: String,
  dirPhone: String,
  numberOfMembers: {
    type: Number,
    required: true
  }
});

// Phone number validation function

function validatePhoneNumber(number) {
  var phoneno = /^(\+\d{1,2}\s?)?1?\-?\.?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
  if(number.match(phoneno))
    return true;
  return false;
}

memberSchema.path('primaryPhone').validate(validatePhoneNumber, ValidationStrings.Member.InvalidPhoneNumber);
memberSchema.path('secondaryPhone').validate(validatePhoneNumber, ValidationStrings.Member.InvalidPhoneNumber);

// Email validation function

function validateEmail(mail) 
{
 if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail))
    return true;
  return false;
}

memberSchema.path('primaryEmail').validate(validateEmail, ValidationStrings.Member.InvalidPhoneNumber);
memberSchema.path('secondaryEmail').validate(validateEmail, ValidationStrings.Member.InvalidEmail);
memberSchema.path('dirEmail').validate(validateEmail, ValidationStrings.Member.InvalidEmail);

const Member = mongoose.model("Member", memberSchema);

// Validates a /POST request
function validatePostMember(member) {
  const schema = {
    _id: Joi.number().disallow(),
    lastName: Joi.string().required(),
    certificateNumber: Joi.number().required(),
    type: Joi.valid(...MemberTypeEnum).required(),
    salutation: Joi.string().required(),
    address: Joi.string().required(),
    location: Joi.string().required(),
    zip: Joi.string().required(),
    primaryPhone: Joi.string().required(),
    secondaryPhone: Joi.string().optional(),
    primaryEmail: Joi.string().required(),
    secondaryEmail: Joi.string().optional(),
    dirEmail: Joi.string().optional(),
    dirName: Joi.string().optional(),
    dirPhone: Joi.string().optional(),
    director: Joi.boolean().optional(),
    numberOfMembers: Joi.number().required()
  };

  return Joi.validate(member, schema);
}

// Validates a /PUT request
function validatePutMember(member) {
  const schema = {
    lastName: Joi.string(),
    certificateNumber: Joi.number(),
    type: Joi.valid(...MemberTypeEnum),
    salutation: Joi.string(),
    address: Joi.string(),
    location: Joi.string(),
    zip: Joi.string(),
    primaryPhone: Joi.string(),
    secondaryPhone: Joi.string(),
    primaryEmail: Joi.string(),
    secondaryEmail: Joi.string(),
    dirEmail: Joi.string(),
    dirName: Joi.string(),
    dirPhone: Joi.string(),
    director: Joi.boolean(),
    numberOfMembers: Joi.number()
  };

  return Joi.validate(member, schema);
}


module.exports.Member = Member;
module.exports.MemberTypeEnum = MemberTypeEnum;
module.exports.validatePostMember = validatePostMember;
module.exports.validatePutMember = validatePutMember;