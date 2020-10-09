
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

function isDevEnv() {
  var env = process.env.NODE_ENV || 'development';
  return env === "development";
}

module.exports.delay = delay;
module.exports.errorResponse = errorResponse;
module.exports.datetimeToNumberTime = datetimeToNumberTime;
module.exports.isDevEnv = isDevEnv;