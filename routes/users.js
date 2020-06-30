const { User, validate, USER_ERRORS } = require('../models/user');
const sheets = require('../modules/google/sheets');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const express = require('express');
const router = express.Router();
const passport = require('passport');
const {auth, checkAuth} = require('../middleware/auth');
const {admin, checkAdmin} = require('../middleware/admin');
const {ValidationStrings} = require('../shared/strings');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const async = require('async');
const config = require('config');


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

// GET current user
router.get('/me', async (req, res) => {
  res.status(200).send(req.user);
});

//#region Login

router.get('/login', function(req, res) {
  res.render('login', {
    user: req.user
  });
});

router.get('/login/:error', function(req, res) {
  if (!req.params.error) {
    return res.render('login', {
      user: req.user
    });
  }

  if (req.params.error === USER_ERRORS.INVALID_CREDENTIALS) {
    return res.render('login', {
      user: req.user,
      error: ValidationStrings.User.InvalidCredentials
    });
  }

  if (req.params.error === USER_ERRORS.USER_DNE) {
    return res.render('login', {
      user: req.user,
      error: ValidationStrings.User.UserDoesNotExist
    });
  }

  return res.render('login', {
    user: req.user,
    error: req.params.error
  });
});

function performLogin(req, res, next) {
  console.log(req);
  passport.authenticate('local', function(err, user, info) {
    console.log(err, user, info);
    if (err) 
      return res.status(400).send(ValidationStrings.User.InvalidCredentials);
    if (!user) 
      return res.status(404).send(ValidationStrings.User.UserDoesNotExist);
    req.logIn(user, function(err) {
      if (err) 
        return res.status(400).send(ValidationStrings.User.InvalidCredentials);
      return res.status(200).send('Login successful.');
    });
  })(req, res, next);
}

router.post('/login/:error', function(req, res, next) {
  performLogin(req, res, next);
});

router.post('/login', function(req, res, next) {
  performLogin(req, res, next);
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


async function performSignup(req, res) {
  const { error } = validate(req.body);
  if (error) 
    return res.status(400).send(error.details[0].message);

  const findUser = await User.findOne({email: req.body.email});
  if (findUser && findUser.length !== 0) 
    return res.status(400).send(ValidationStrings.User.UserAlreadyExists);

  const allMembers = await sheets.getAllMembers(false);

  // Check if member making reservation exists
  const member = allMembers.filter(member => 
    member.primaryEmail.toLowerCase() === req.body.email.toLowerCase() ||
    member.secondaryEmail.toLowerCase() === req.body.email.toLowerCase());

  if (member.length === 0) 
    return res.status(400).send(ValidationStrings.User.MemberNotFound);

  var user = new User({
      email: req.body.email,
      password: req.body.password
    });

  await user.save(function(err, user) {
    if (err) 
      return res.status(400).send('Unknown error occured');
    req.logIn(user, function(err) {
      if (err) 
        return res.status(400).send('Unknown error occured');
      return res.status(200).send('User successfully created.');
    });
  });
}

router.post('/signup', async (req, res) => {
  await performSignup(req, res);
});

router.post('/signup/:error', async (req, res) => {
  await performSignup(req, res);
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

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) 
          return res.status(404).send('No account with that email address exists.');

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.get('gmailAccount'),
          pass: config.get('gmailPass')
        }
      });
      const url = 'http://' + req.headers.host + '/users/reset/' + token;
      var mailOptions = {
        to: user.email,
        from: config.get('gmailAccount'),
        subject: ValidationStrings.User.Forgot.ResetSubject,
        html: ValidationStrings.User.Forgot.ResetBody.format(url)
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('info', ValidationStrings.User.Forgot.ResetLinkSent.format(user.email));
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    return res.status(200).send('Password validation has been sent');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', ValidationStrings.User.Forgot.TokenInvalid);
      return res.redirect('/forgot');
    }
    res.render('reset', {
      user: req.user
    });
  });
});

router.post('/reset/:token', function(req, res) {
  
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) 
          return res.status(404).send(ValidationStrings.User.Forgot.TokenInvalid);

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        user.save(function(err) {
          req.logIn(user, function(err) {
            done(err, user);
          });
        });
      });
    },
    function(user, done) {
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
      smtpTransport.sendMail(mailOptions, function(err) {
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    return res.status(200).send('Reset password was successful');
  });
});

//#endregion

module.exports = router;