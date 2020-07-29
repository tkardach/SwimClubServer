require('./extensions');

const ValidationStrings = {
  User: {
    InvalidCredentials: 'Invalid Email or Password.',
    UserDoesNotExist: 'User with this email does not exist',
    UserAlreadyExists: 'User with this email already exists',
    MemberNotFound: 'Cannot find member with given email, make sure to use one of your swim club membership emails.',
    Forgot: {
      ResetSubject: 'Saratoga Swim Club Password Reset',
      ResetBody: `

<p>
You are receiving this because you (or someone else) have requested to reset your Saratoga Swim Club account password.

Please click on the following link to reset your password
</p>
<a href="{0}">{0}</a>
<p>
This link will expire in 1 hour. If you did not request this, please ignore this email and your password will remain unchanged.
</p>
      `,
      ResetLinkSent: 'Reset link has been sent to {0}.',
      TokenInvalid: 'Password Reset Token is invalid or has expired.',
      ResetCompleteSubject: 'Your password has been changed',
      ResetCompleteBody: `
This is a confirmation that the password for your account {0} has been successfully changed.
      `
    },
    Issue: {
      Subject: '***Reservation System Issue Reported***'
    }
  },
  Member: {
    AlreadyExists: 'Member with that last name and/or certificate number already exists',
    MemberIdNotFound: 'Member with that id was not found.'
  },
  Validation: {
    InvalidPhoneNumber: 'Value `{VALUE}` is not a valid phone number.',
    InvalidEmail: 'Value `{VALUE}` is not a valid email address.',
    InvalidTime: 'Value `{VALUE}` is not a valid time',
    InvalidDateFormat: 'Date parameter is not in a valid date format.'
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
    PostReservationsFull: 'Reservation cannot be made, all reservation slots have been filled',
    PostDuesNotPaid: 'Member {0} has not paid their dues and cannot make a reservation. Contact the Saratoga Swim Club Board of Directors if this information is incorrect.',
    PostMaxReservationsMadeForWeek: `Member already has {0} or more {1} reservations for this week.`,
    PostMaxReservationsMadeForDay: `Member has already made {0} or more {1} reservations for {2}`
  },
  Schedules: {
    DateRequired: 'Date parameter is required',
    InvalidDate: 'Date parameter {0} is not a valid date',
    ScheduleExists: 'Schedule for {0} starting on {1} already exists',
    ScheduleDoesNotExist: 'Schedule with that Id does not exist',
    DayInvalid: 'Day number must be between 0 and 6 inclusively. {0} is invalid'
  }
}


const StringConstants = {
  Calendar: {
    Scopes: {
      EventsRW: "https://www.googleapis.com/auth/calendar.events"
    }
  },
  Sheets: {
    Scopes: {
      SheetsR: 'https://www.googleapis.com/auth/spreadsheets.readonly'
    }
  },
  Schedule: {
    Types: {
      Lap: 'lap',
      Family: 'family',
      Lessons: 'lessons',
      Blocked: 'blocked'
    }
  }
}

module.exports.ValidationStrings = ValidationStrings;
module.exports.StringConstants = StringConstants;