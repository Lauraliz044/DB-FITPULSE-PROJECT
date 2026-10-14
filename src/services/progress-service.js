const reservations = require('../repositories/reservation-repository');
const users = require('../repositories/user-repository');
const { found, allowOwner } = require('../utils/errors');
const { businessDate, utcDate, weekStart, previousWeek } = require('../utils/time');
const settings = require('../config/settings');

function calculate(rows, today = businessDate()) {
  const weeks = new Set();
  const categoryTotals = {};
  for (const item of rows) {
    weeks.add(weekStart(businessDate(utcDate(item.attended_at))));
    categoryTotals[item.category] = (categoryTotals[item.category] || 0) + 1;
  }
  const currentWeek = weekStart(today);
  let cursor = weeks.has(currentWeek) ? currentWeek : previousWeek(currentWeek);
  let weeklyStreak = 0;
  while (weeks.has(cursor)) {
    weeklyStreak += 1;
    cursor = previousWeek(cursor);
  }
  return {
    weeklyStreak, totalAttended: rows.length,
    categoryTotals, timeZone: settings.timeZone, weekStartsOn: 'Monday'
  };
}

async function get(userId, user) {
  allowOwner(user, userId);
  found(await users.findById(userId), 'User');
  return calculate(await reservations.attended(userId));
}

module.exports = { calculate, get };
