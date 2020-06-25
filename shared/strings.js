if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

const ValidationStrings = {
  Member: {
    AlreadyExists: 'Member with that last name and/or certificate number already exists',
    MemberIdNotFound: 'Member with that id was not found.'
  },
  Due: {
    InvalidMembershipYear: 'Value `{VALUE}` is not a valid membership year.'
  },
  Reservation: {
    EmptyReservation: 'empty',
    ReservedReservation: 'reserved',
    ReservationAlreadyReserved: 'This reservation has already been reserved.',
    ReservationNotFound: 'Reservation with that id was not found.',
    InvalidReservationDate: 'Value `{VALUE}` is not a valid reservation date.',
    DateParamRequired: 'Date param required for api/reservation/date/:date.',
    ReservationTimeslotDoesNotExist: 'Timeslot is not associated with the active schedule.',
    PostReservationOnClosedDate: 'Reservation cannot be made on closed date.',
    PostReservationOnClosedHours: 'Reservation cannot be made during closed hours.',
    PostReservationNoSchedule: 'Reservation cannot be made as there is no scheduled time during this period.',
    PostReservationsFull: 'Reservation cannot be made, all reservation slots have been filled'
  },
  Schedule: {
    NoCurrentSchedule: 'There is no schedule set for the current time period.',
    DateParamRequired: 'Date param required for api/schedule/date/:date.',
    TimeslotOutOfRange: 'Timeslot range is outside the schedule limits.'
  },
  Timeslot: {
    NoTimeslotFound: 'Timeslot with that ID could not be found.'
  },
  Validation: {
    InvalidPhoneNumber: 'Value `{VALUE}` is not a valid phone number.',
    InvalidEmail: 'Value `{VALUE}` is not a valid email address.',
    InvalidTime: 'Value `{VALUE}` is not a valid time',
    InvalidDateFormat: 'Date parameter is not in a valid date format.'
  }
}


const StringConstants = {
  Calendar: {
    Scopes: {
      EventsRW: "https://www.googleapis.com/auth/calendar.events"
    }
  }
}

module.exports.ValidationStrings = ValidationStrings;
module.exports.StringConstants = StringConstants;