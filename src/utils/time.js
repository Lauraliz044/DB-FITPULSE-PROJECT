const settings = require('../config/settings');

function businessDate(value = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: settings.timeZone, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(value);
  const values = {};
  for (const part of parts) values[part.type] = part.value;
  return `${values.year}-${values.month}-${values.day}`;
}

function utcDate(value) {
  return new Date(`${value.replace(' ', 'T')}Z`);
}

function weekStart(dateText) {
  const date = new Date(`${dateText}T00:00:00Z`);
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return date.toISOString().slice(0, 10);
}

function previousWeek(dateText) {
  const date = new Date(`${dateText}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 7);
  return date.toISOString().slice(0, 10);
}

module.exports = { businessDate, utcDate, weekStart, previousWeek };
