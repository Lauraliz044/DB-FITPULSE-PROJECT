const repository = require('../repositories/purchase-repository');
const check = require('../utils/validation');
const { businessDate, utcDate } = require('../utils/time');
const settings = require('../config/settings');

async function sales(query) {
  check.fields(query, ['date']);
  const date = query.date === undefined ? businessDate() : check.date(query.date, 'date');
  const rows = await repository.sales();
  let purchaseCount = 0;
  let totalCents = 0;
  const packageTotals = {};
  for (const item of rows) {
    if (businessDate(utcDate(item.purchased_at)) !== date) continue;
    const cents = Math.round(Number(item.paid_price) * 100);
    purchaseCount += 1;
    totalCents += cents;
    if (!packageTotals[item.package_id]) {
      packageTotals[item.package_id] = { packageId: item.package_id, purchaseCount: 0, cents: 0 };
    }
    packageTotals[item.package_id].purchaseCount += 1;
    packageTotals[item.package_id].cents += cents;
  }
  const packages = Object.values(packageTotals).map((item) => ({
    packageId: item.packageId, purchaseCount: item.purchaseCount,
    totalPaid: (item.cents / 100).toFixed(2)
  }));
  return { date, timeZone: settings.timeZone, purchaseCount,
    totalPaid: (totalCents / 100).toFixed(2), packages };
}

module.exports = { sales };
