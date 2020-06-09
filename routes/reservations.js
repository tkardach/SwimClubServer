require('../shared/extensions');
const {Reservation, validatePostReservation, validatePutReservation} = require('../models/reservation');
const {Schedule} = require('../models/schedule');
const {Member} = require('../models/member');
const {auth, checkAuth} = require('../middleware/auth');
const {admin, checkAdmin} = require('../middleware/admin');
const express = require('express');
const router = express.Router();
const validateObjectId = require('../middleware/validateObjectId');
const {ValidationStrings} = require('../shared/strings');
const _ = require('lodash');

// Remove member information from reservations
function removeSensitiveData(reservations) {
  for(let i=0; i<reservations.length; i++) {
    if (reservations[i].member != ValidationStrings.Reservation.EmptyReservation)
      reservations[i].member = ValidationStrings.Reservation.ReservedReservation;
  }
  
  return reservations;
}

// GET from the database
router.get('/', [checkAuth, checkAdmin], async (req, res) => {
  let reservations = await Reservation.find();

  // Protect member information if non-admin
  if (!req.isAuthenticated || !req.isAdmin) {
    reservations = removeSensitiveData(reservations);
  }

  res.status(200).send(reservations);
});

// GET by specific date
router.get('/date/:date', [checkAuth, checkAdmin], async (req, res) => {
  if (!req.params || !req.params.date || req.params.date === undefined) 
    return res.status(400).send(ValidationStrings.Reservation.DateParamRequired);

  // convert parameter date to object date
  const date = new Date(req.params.date);
  if (isNaN(date)) return res.status(400).send(ValidationStrings.Validation.InvalidDateFormat);

  // get all reservations made on this date
  let reservations = await Reservation.reservationsOnDate(date);

  // Protect member information if non-admin
  if (!req.isAuthenticated || !req.isAdmin) {
    reservations = removeSensitiveData(reservations);
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

  const date = new Date(req.body.date);

  const schedule = await Schedule.byDate(date);
  if (!schedule) return res.status(400).send(ValidationStrings.Reservation.PostReservationNoSchedule);

  // make sure reservation is during open hours
  if (!schedule.isOpenOnDate(date))
    return res.status(400).send(ValidationStrings.Reservation.PostReservationOnClosedDate);
  
  if (!schedule.isOpenDuringTime(req.body.startTime) || 
    !schedule.isOpenDuringTime(req.body.endTime))
    return res.status(400).send(ValidationStrings.Reservation.PostReservationOnClosedHours);

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
router.put('/:id', [checkAuth, checkAdmin], async (req, res) => {
  const { error } = validatePutReservation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let reservation = await Reservation.findById(req.params.id);
  if (!reservation) return res.status(404).send(ValidationStrings.Reservation.ReservationNotFound);

  let content;
  if (req.isAuthenticated && req.isAdmin) {
    content = _.pick(req.body,
      [
        'member',
        'date',
        'startTime',
        'endTime'
      ]);
  } else {
    // Check if reservation already has member assigned
    if (reservation.member !== ValidationStrings.Reservation.EmptyReservation)
      return res.status(400).send(ValidationStrings.Reservation.ReservationAlreadyReserved);

    // Check if member exists
    const member = await Member.findById(req.body.member);
    if (!member) return res.status(404).send(ValidationStrings.Member.MemberIdNotFound);

    content = _.pick(req.body,
      [
        'member'
      ]);
  }

  // change contents of reservation to include PUT changes
  _.extend(reservation, content);

  // add reservation to database
  await reservation.save(function (err, reservation) {
    if (err)
      res.status(400).send(err);
    else
      res.status(200).send(reservation);
  });
});


// DELETE from database
router.delete('/:id', validateObjectId, async (req, res) => {
  res.status(200).send("This feature is currently under development");
});

module.exports = router;