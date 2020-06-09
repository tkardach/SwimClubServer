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
    AlreadyExists: 'Member with that last name and/or certificate number already exists'
  },
  Due: {
    InvalidMembershipYear: 'Value `{VALUE}` is not a valid membership year.'
  },
  Reservation: {
    EmptyReservation: 'empty',
    ReservedReservation: 'reserved'
  },
  Validation: {
    InvalidPhoneNumber: 'Value `{VALUE}` is not a valid phone number.',
    InvalidEmail: 'Value `{VALUE}` is not a valid email address.',
    InvalidTime: 'Value `{VALUE}` is not a valid time'
  }
}


module.exports.ValidationStrings = ValidationStrings;