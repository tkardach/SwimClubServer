const config = require("config");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const Joi = require("joi");
const mongoose = require("mongoose");
const passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date
});

function parseGenSaltError(err) {

}

userSchema.pre('save', function(next) {
  var user = this;
  var SALT_FACTOR = 12;

  if (!user.isModified('password')) return next();

  bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
    if (err) 
      return next(err);
    
    bcrypt.hash(user.password, salt, function(err, hash) {
      if (err) 
        return next(err);
      
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

const User = mongoose.model("User", userSchema);

passport.use(new LocalStrategy(function(email, password, done) {
  User.findOne({ email: email.toLowerCase().trim() }, function(err, user) {
    if (err) return done(err);
    if (!user) return done({ message: 'Incorrect email or password.', code: USER_ERRORS.INVALID_CREDENTIALS }, false);
    user.comparePassword(password, function(err, isMatch) {
      if (isMatch) {
        return done(null, user);
      } else {
        return done({ message: 'Incorrect email or password.', code: USER_ERRORS.INVALID_CREDENTIALS }, false);
      }
    });
  });
}));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


function validateUser(user) {
  // Exclude isAdmin from schema, so users cannot set themselves to admins
  const schema = {
    username: Joi.string()
      .required()
      .email(),
    password: Joi.string()
      .required(),
    confirm: Joi.string().optional()
  };

  return Joi.validate(user, schema);
}

const USER_ERRORS = {
  INVALID_CREDENTIALS: '0',
  USER_DNE: '1',
  USER_EXISTS: '2',
  MEMBER_NOT_FOUND: '3'
}

exports.User = User;
exports.validate = validateUser;
exports.USER_ERRORS = USER_ERRORS;