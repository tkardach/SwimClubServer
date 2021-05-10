const express = require('express');
const router = express.Router();

// GET home page
router.get('/', async (req, res) => {
  return res.status(200).send();
});

// Redirects

// redirect old reservations api to home page
router.get('/api/reservations', async (req, res) => {
  res.redirect('/');
});

module.exports = router;