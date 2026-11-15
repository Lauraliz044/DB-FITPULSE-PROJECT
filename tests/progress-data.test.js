const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

// Load the browser's pure ES module without changing the CommonJS server.
const model = fs.readFile(path.join(__dirname, '../public/js/progress-data.js'), 'utf8')
  .then((source) => import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`));

test('calendar keeps Monday-to-Sunday weeks across a year boundary', async () => {
  const { calendarDays } = await model;
  const days = calendarDays('2027-01-01', ['2026-12-28', '2027-01-01', '2027-01-01']);
  assert.equal(days[0].date, '2026-12-28');
  assert.equal(days[6].date, '2027-01-03');
  assert.equal(days[4].count, 2);
  assert.equal(days.filter((day) => day.today).length, 1);
  assert.equal(days[4].today, true);
});

test('calendar navigation counts only the selected week and keeps empty days', async () => {
  const { calendarDays } = await model;
  const days = calendarDays('2026-11-14', ['2026-11-04', '2026-11-14'], -1);
  assert.equal(days[0].date, '2026-11-02');
  assert.equal(days[2].count, 1);
  assert.equal(days.reduce((sum, day) => sum + day.count, 0), 1);
  assert.equal(days.some((day) => day.today), false);
  assert.ok(calendarDays('2026-11-14', []).every((day) => day.count === 0));
});

test('category percentages share the same denominator and sum to 100', async () => {
  const { categoryShares } = await model;
  const shares = categoryShares({ yoga: 4, spinning: 2, crossfit: 1 });
  assert.equal(shares[0].name, 'yoga');
  assert.equal(shares[0].count, 4);
  assert.equal(shares.reduce((sum, item) => sum + item.count, 0), 7);
  assert.ok(Math.abs(shares.reduce((sum, item) => sum + item.percent, 0) - 100) < 1e-10);
  assert.deepEqual(categoryShares({ yoga: 0 }), []);
  assert.deepEqual(categoryShares({}), []);
});
