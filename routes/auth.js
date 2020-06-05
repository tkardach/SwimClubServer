const Joi = require('joi');
const bcrypt = require('bcrypt');
const {User} = require('../models/user');
const express = require('express');
const router = express.Router();

// Define the default route 
router.post('/', async (req, res) => {
  // validate the request body to match login parameters
  const { error } = validate(req.body); 
  if (error) return res.status(400).send(error.details[0].message);

  // Search the database for the matching user email
  let user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).send('Invalid email or password.');

  // Match the password of the user
  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword) return res.status(400).send('Invalid email or password.');

  // Generate an authorization token and return it to the user
  const token = user.generateAuthToken();
  res.send(token);
});

// Validation function
function validate(req) {
  const schema = {
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required()
  };

  return Joi.validate(req, schema);
}

module.exports = router; 