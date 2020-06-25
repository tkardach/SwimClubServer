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