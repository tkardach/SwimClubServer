const {Reservation, validatePostReservation, validatePutReservation} = require('../models/reservation');
const {auth, checkAuth} = require('../middleware/auth');
const {admin, checkAdmin} = require('../middleware/admin');
const express = require('express');
const router = express.Router();
const validateObjectId = require('../middleware/validateObjectId');
const {ValidationStrings} = require('../shared/strings');


// GET from the database
router.get('/', [checkAuth, checkAdmin], async (req, res) => {
  const reservations = await Reservation.find();

  if (!req.isAuthenticated || !req.isAdmin) {
    for(let i=0; i<reservations.count; i++) {
      if (reservations[i].member != ValidationStrings.Reservation.EmptyReservation)
        reservations[i].member = ValidationStrings.Reservation.ReservedReservation;
    }
  }

  res.status(200).send(reservations);
});

// GET by id from database
router.get('/:id', async (req, res) => {
  res.status(200).send("");
});


// POST to database
router.post('/', async (req, res) => {
  res.status(200).send("");
});


// PUT to database
router.put('/:id', validateObjectId, async (req, res) => {
  res.status(200).send("");
});


// DELETE from database
router.delete('/:id', validateObjectId, async (req, res) => {
  res.status(200).send("");
});

module.exports = router;