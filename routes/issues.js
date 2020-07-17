const express = require('express');
const router = express.Router();
const config = require('config');
const {logError} = require('../debug/logging');
const {ValidationStrings} = require('../shared/strings');
const {errorResponse} = require('../shared/utility');
const {sendEmail} = require('../modules/google/email');


router.post('/', async (req, res) => {
  if (!req.body.description) 
    return res.status(400).send(errorResponse(400, 'Need a description to report an issue.'));

  try {
    await sendEmail(ValidationStrings.User.Issue.Subject, req.body.description, config.get('issuesEmail'));
    return res.status(200).send('Email sent!');
  } catch(err) {
    logError(err);
    return res.status(500).send(errorResponse(500, 'Failed to send email, try again later.'))
  }
})

module.exports = router;