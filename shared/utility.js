
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

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}


module.exports.uuidv4 = uuidv4;
module.exports.delay = delay;
module.exports.errorResponse = errorResponse;
module.exports.datetimeToNumberTime = datetimeToNumberTime;
module.exports.isDevEnv = isDevEnv;