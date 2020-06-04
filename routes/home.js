const express = require('express');
const router = express.Router();

// GET home page
router.get('/', async (req, res) => {
  return res.status(200).send();
});

module.exports = router;