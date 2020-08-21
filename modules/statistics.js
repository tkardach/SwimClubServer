const calendar = require('./google/calendar')
const sheets = require('./google/sheets');

async function memberReservationsForCurrentWeek() {
  return memberReservationsForGivenWeek(new Date())
}

async function memberReservationsForGivenWeek(date) {
  // Check if member has already made max reservations for the week
  let weekStart = new Date(date);
  weekStart.setHours(0,0,0,0);
  let weekEnd = new Date(weekStart);

  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 1) % 7)); // weeks start on saturday, find begininning of week relative to date

  if (weekEnd.getDay() === 6) // weeks end on friday, find end of week relative to date
    weekEnd.setDate(weekEnd.getDate() + 6);
  else
    weekEnd.setDate(weekEnd.getDate() + 5 - weekEnd.getDay());
  
  const eventsForWeek = await calendar.getEventsForDateAndTime(weekStart, weekEnd, 0, 2359);

  const memberRes = {}
  eventsForWeek.forEach(event => {
    if (event.description !== 'family') return;
    if (event.summary in memberRes) {
      memberRes[event.summary] += 1;
    } else {
      memberRes[event.summary] = 1;
    }
  })

  return memberRes;
}

async function test() {
  let stats = await memberReservationsForCurrentWeek()
  let members = await sheets.getAllPaidMembersDict()
  let fullRes = Object.keys(stats).reduce((filtered, key) => {
    if (stats[key] >= 3) filtered[key] = 3
    return filtered
  }, {})
  console.log('Total members reserved this week: ' + Object.keys(stats).length)
  console.log('Total paid members: ' + Object.keys(members).length)
  console.log('Total members with 3+ reservations: ' + Object.keys(fullRes).length)

  let lastWeek = new Date()
  lastWeek.setDate(lastWeek.getDate() - 7)
  let lastStats = await memberReservationsForGivenWeek(lastWeek)
  console.log('Total members reserved 1 weeks ago: ' + Object.keys(lastStats).length)
  lastWeek.setDate(lastWeek.getDate() - 7)
  lastStats = await memberReservationsForGivenWeek(lastWeek)
  console.log('Total members reserved 2 weeks ago: ' + Object.keys(lastStats).length)
  lastWeek.setDate(lastWeek.getDate() - 7)
  lastStats = await memberReservationsForGivenWeek(lastWeek)
  console.log('Total members reserved 3 weeks ago: ' + Object.keys(lastStats).length)
  lastWeek.setDate(lastWeek.getDate() - 7)
  lastStats = await memberReservationsForGivenWeek(lastWeek)
  console.log('Total members reserved 4 weeks ago: ' + Object.keys(lastStats).length)
}


test()