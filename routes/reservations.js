require('../shared/extensions');
const {Reservation, validatePostReservation, validatePutReservation} = require('../models/reservation');
const {auth, checkAuth} = require('../middleware/auth');
const {admin, checkAdmin} = require('../middleware/admin');
const express = require('express');
const router = express.Router();
const validateObjectId = require('../middleware/validateObjectId');
const {ValidationStrings} = require('../shared/strings');
const _ = require('lodash');


// GET from the database
router.get('/', [checkAuth, checkAdmin], async (req, res) => {
  const reservations = await Reservation.find();

  // Protect member information if non-admin
  if (!req.isAuthenticated || !req.isAdmin) {
    for(let i=0; i<reservations.length; i++) {
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
router.post('/', [auth, admin], async (req, res) => {
  const { error } = validatePostReservation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let date = new Date(req.body.date);
  let today = new Date();
  if (date.compareDate(today) < 0) return res.status(400).send('err');

  // construct reservation from request body
  const reservation = new Reservation(_.pick(req.body,
    [
      'member',
      'date',
      'startTime',
      'endTime'
    ]));

  // add reservation to database
  await reservation.save(function (err, reservation) {
    if (err)
      res.status(400).send(err);
    else
      res.status(200).send(reservation);
  });
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