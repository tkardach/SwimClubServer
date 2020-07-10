
const delay = ms => new Promise(res => setTimeout(res, ms));


function errorResponse(status, message) {
  return {
    status: status,
    message: message
  }
}

function datetimeToNumberTime(datetime) {
  let date = new Date(datetime);
  var hours = date.getHours();
  var minutes = date.getMinutes();
  return (hours * 100) + minutes;
}

module.exports.delay = delay;
module.exports.errorResponse = errorResponse;
module.exports.datetimeToNumberTime = datetimeToNumberTime;