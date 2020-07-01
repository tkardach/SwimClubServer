
const delay = ms => new Promise(res => setTimeout(res, ms));


function errorResponse(status, message) {
  return {
    status: status,
    message: message
  }
}

module.exports.delay = delay;
module.exports.errorResponse = errorResponse;