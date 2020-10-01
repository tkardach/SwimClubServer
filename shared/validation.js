
// Open hours validation function
function validateTime(time) {
  return (time >= 0) &&           // time is greater than 0
    (time % 100 < 60) &&         // minutes is less than 60
    (parseInt(time / 100) < 24); // hours is less than 24
}

// Phone number validation function
function validatePhoneNumber(number) {
  var phoneno = /^(\+\d{1,2}\s?)?1?\-?\.?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
  if(number.match(phoneno))
    return true;
  return false;
}

// Email validation function
function validateEmail(mail) {
 if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail))
    return true;
  return false;
}

function getValidDate(test) {
  if(isNaN(test)){ 
    var dt=new Date(test);
    if(isNaN(dt.getTime())){ 
      return null;
    }else{
      return dt; 
    }
  } else{
    return new Date(Number(test));
  }
}

module.exports.validateEmail = validateEmail;
module.exports.validateTime = validateTime;
module.exports.validatePhoneNumber = validatePhoneNumber;
module.exports.getValidDate = getValidDate;