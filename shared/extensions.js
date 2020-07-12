const {validateTime} = require('./validation')

// Date methods
if (!Date.prototype.compareDate) {
  Date.prototype.compareDate = function(date1) {
    if (!(date1 instanceof Date))
      return false;

    let date = new Date(this);
    let comp = new Date(date1);
    date.setHours(0,0,0,0);
    comp.setHours(0,0,0,0);

    if (date < comp) return -1;
    else if (date > comp) return 1;
    else return 0;
  }
}

if (!Date.prototype.compareTime) {
  Date.prototype.compareTime = function(date) {
    if (!(date instanceof Date))
      return false;

    let self = new Date(this);

    if (self.compareDate(date) !== 0)
      return self.compareDate(date);
    
    let hours = self.getHours() - date.getHours();
    let minutes = self.getMinutes() - date.getMinutes();
    if (hours !== 0) return hours > 0 ? 1 : -1;
    if (minutes !== 0) return minutes > 0 ? 1 : -1;
    return 0;
  }
}

if (!Date.prototype.equalsTimeNumber) {
  Date.prototype.equalsTimeNumber = function(number) {
    if (!validateTime(number)) return false;

    let self = new Date(this);
    if (self.getHours() !== parseInt(number / 100) || self.getMinutes() !== (number % 100)) return false;
    return true;
  }
}

// String methods
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