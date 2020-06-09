
if (!Date.prototype.compareDate) {
  Date.prototype.compareDate = function(date1) {
    if (!(date1 instanceof Date))
      return false;

    let date = new Date(this);
    date.setHours(0,0,0,0);
    date1.setHours(0,0,0,0);

    if (date < date1) return -1;
    else if (date > date1) return 1;
    else return 0;
  }
}