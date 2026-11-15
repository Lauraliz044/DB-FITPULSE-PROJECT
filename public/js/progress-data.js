// Dates here are YYYY-MM-DD in the business time zone, not browser-local dates.
export function weekStart(value) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}

export function calendarDays(today, attendanceDates, offset = 0) {
  const cursor = new Date(`${weekStart(today)}T12:00:00Z`);
  cursor.setUTCDate(cursor.getUTCDate() + offset * 7);
  return Array.from({ length: 7 }, () => {
    const date = cursor.toISOString().slice(0, 10);
    const count = attendanceDates.filter((value) => value === date).length;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    return { date, count, today: date === today };
  });
}

export function categoryShares(totals) {
  const entries = Object.entries(totals).filter(([, count]) => count > 0);
  const sum = entries.reduce((total, [, count]) => total + count, 0);
  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      count,
      percent: (count / sum) * 100,
    }));
}
