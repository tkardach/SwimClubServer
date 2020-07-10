
const delay = ms => new Promise(res => setTimeout(res, ms));


function errorResponse(status, message) {
  return {
    status: status,
    message: message
  }
}

function datetimeToNumberTime(datetime) {
  var hours = datetime.getHours();
  var minutes = datetime.getMinutes();
  return (hours * 100) + minutes;
}

module.exports.delay = delay;
module.exports.errorResponse = errorResponse;
module.exports.datetimeToNumberTime = datetimeToNumberTime;