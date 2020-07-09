const { User, validate, USER_ERRORS } = require('../models/user');
const _ = require('lodash');
const express = require('express');
const router = express.Router();
const passport = require('passport');
const {admin, checkAdmin} = require('../middleware/admin');
const {auth} = require('../middleware/auth');
const {ValidationStrings} = require('../shared/strings');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const config = require('config');
const sheets = require('../modules/google/sheets');
const calendar = require('../modules/google/calendar');
const {errorResponse} = require('../shared/utility');


router.get('/', async (req, res) => {
  res.render('user', {
    title: 'Saratoga Swim Club',
    user: req.user
  });
});

router.get('/session', async (req, res) => {
  if (req.user) {
    return res.status(200).send({
      sessionExists : true 
    });
  }
  return res.status(200).send({
    sessionExists : false 
  });
});

async function generateUserInformation(user) {
  const ret = {};

  if (!user) return ret;

  const dbUser = await User.findOne({email: user.email});
  if (!dbUser) return ret

  const allMembers = await sheets.getAllMembers(false);

  // Check if member making reservation exists
  const members = allMembers.filter(member => 
    member.primaryEmail.toLowerCase() === user.email.toLowerCase() ||
    member.secondaryEmail.toLowerCase() === user.email.toLowerCase());

  if (members.length > 1) return errorResponse(400, 'More than 1 user found with this email.');

  const member = members[0];
  const events = await calendar.getEventsForUserId(member.certificateNumber);
  
  ret.user = {
    lastName: member.lastName,
    certificateNumber: member.certificateNumber
  }

  ret.events = events;
  ret.status = 200;

  return ret;
}

// GET current user
router.get('/me', [auth] ,async (req, res) => {
  const result = await generateUserInformation(req.user);
  res.status(result.status).send(result);
});

//#region Login

router.get('/login', function(req, res) {
  res.render('login', {
    user: req.user
  });
});

router.post('/login', function(req, res, next) {
  const {error} = validate(req.body);
  if (error) 
    return res.status(400).send(error.details[0].message);
  
  if (req.body.username === '')
    return res.status(400).send(errorResponse(400, "Member Email must not be empty."))

  passport.authenticate('local', function(err, user, info) {
    if (err) 
      return res.status(400).send(errorResponse(400, ValidationStrings.User.InvalidCredentials));
    if (!user) 
      return res.status(404).send(errorResponse(404, ValidationStrings.User.UserDoesNotExist));
    req.logIn(user, function(err) {
      if (err) 
        return res.status(400).send(errorResponse(400, ValidationStrings.User.InvalidCredentials));
      return res.status(200).send('Login successful.');
    });
  })(req, res, next);
});

//#endregion

//#region Signup

router.get('/signup', function(req, res) {
  res.render('signup', {
    user: req.user
  });
});

router.get('/signup/:error', function(req, res) {
  if (!req.params.error) {
    return res.render('signup', {
      user: req.user
    });
  }

  if (req.params.error === USER_ERRORS.USER_EXISTS) {
    return res.render('signup', {
      user: req.user,
      error: ValidationStrings.User.UserAlreadyExists 
    });
  }

  if (req.params.error === USER_ERRORS.MEMBER_NOT_FOUND) {
    return res.render('signup', {
      user: req.user,
      error: ValidationStrings.User.MemberNotFound
    });
  }

  return res.render('signup', {
    user: req.user,
    error: req.params.error
  });
});

router.post('/signup', async (req, res) => {
  const { error } = validate(req.body);
  if (error) 
    return res.status(400).send(error.details[0].message);

  req.body.username = req.body.username.toLowerCase();

  const findUser = await User.findOne({email: req.body.username});
  if (findUser && findUser.length !== 0) 
    return res.status(400).send(errorResponse(400, ValidationStrings.User.UserAlreadyExists));

  const allMembers = await sheets.getAllMembers(false);

  // Check if member making reservation exists
  const member = allMembers.filter(member => 
    member.primaryEmail.toLowerCase() === req.body.username.toLowerCase() ||
    member.secondaryEmail.toLowerCase() === req.body.username.toLowerCase());

  if (member.length === 0) 
    return res.status(400).send(errorResponse(400, ValidationStrings.User.MemberNotFound));

  var user = new User({
      email: req.body.username.trim(),
      password: req.body.password
    });

  await user.save(function(err, user) {
    if (err) 
      return res.status(400).send(errorResponse(400, 'Unknown error occured'));
    req.logIn(user, function(err) {
      if (err) 
        return res.status(400).send(errorResponse(400, 'Unknown error occured'));
      return res.status(200).send('User successfully created.');
    });
  });
});

//#endregion

router.get('/logout', function(req, res){
  req.logout();
  res.status(200).send('Logout successful.');
});

//#region  Forgot Email/Password

router.get('/forgot', function(req, res) {
  res.render('forgot', {
    user: req.user
  });
});

router.post('/forgot', async (req, res) => {
  try {
    if (!req.body.email) 
      return res.status(400).send(errorResponse(400, 'Email is required to reset password'));

    var token = crypto.randomBytes(20).toString('hex');

    const user = await User.findOneAndUpdate({ email: req.body.email }, {
      resetPasswordToken: token,
      resetPasswordExpires: Date.now() + 3600000
    },{
      new: true
    });

    if (!user) 
      return res.status(404).send(errorResponse(404, 'No account with that email address exists.'));

    const url = 'https://' + req.headers.host + '/api/users/reset/' + token;

    var smtpTransport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.get('gmailAccount'),
        pass: config.get('gmailPass')
      }
    });

    var mailOptions = {
      to: req.body.email,
      from: config.get('gmailAccount'),
      subject: ValidationStrings.User.Forgot.ResetSubject,
      html: ValidationStrings.User.Forgot.ResetBody.format(url)
    };

    await smtpTransport.sendMail(mailOptions);
  
    return res.status(200).send('Password validation has been sent');
  } catch (err) {
    return res.status(500).send(errorResponse(400, `Error occured while sending email verification: ${err}`));
  }
});

router.get('/reset/:token', async (req, res) => {
  const user = await User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } });
  if (!user) 
    return res.status(404).send({message: ValidationStrings.User.Forgot.TokenInvalid})
  res.render('reset', {
    user: req.user
  });
});

router.post('/reset/:token', async (req, res, next) => {
  try {
    const user = await User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) 
      return res.status(404).send(errorResponse(404, ValidationStrings.User.Forgot.TokenInvalid));
  
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
  
    await user.save(function(err) {
      if (err) 
        return res.status(500).send(errorResponse(500, 'Error while attempting to reset password'))
    });
    
    var smtpTransport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.get('gmailAccount'),
        pass: config.get('gmailPass')
      }
    });
    var mailOptions = {
      to: user.email,
      from: config.get('gmailAccount'),
      subject: ValidationStrings.User.Forgot.ResetCompleteSubject,
      text: ValidationStrings.User.Forgot.ResetCompleteBody.format(user.email)
    };
    smtpTransport.sendMail(mailOptions);
  
    return res.status(200).send('Reset password was successful');
  } catch (err) {
    return res.status(500).send(errorResponse(500, 'Error occured during password reset '))
  }
});

//#endregion

module.exports = router;