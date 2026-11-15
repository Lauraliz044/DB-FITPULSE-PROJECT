import { getConfiguration } from "./api.js";

const thousandsPattern = /\B(?=(\d{3})+(?!\d))/g;

export function apiDate(value) {
  return new Date(`${value.replace(" ", "T")}Z`);
}

export function money(value) {
  const digits = Math.round(Number(value)).toString();
  return `${digits.replace(thousandsPattern, ".")} COP`;
}

export function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export async function scheduleFormatter() {
  const { timeZone } = await getConfiguration();
  const day = new Intl.DateTimeFormat("es-CO", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const time = new Intl.DateTimeFormat("es-CO", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  });
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    hourCycle: "h23",
  });
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const today = dateKey.format(new Date());
  const shortDate = new Intl.DateTimeFormat("es-CO", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
  return {
    isToday: (value) => dateKey.format(apiDate(value)) === today,
    shortDate: (value) => shortDate.format(apiDate(value)),
    day: (value) => capitalize(day.format(apiDate(value))),
    time: (value) => time.format(apiDate(value)),
    hour: (value) => Number(hour.format(apiDate(value))),
    range(start, end) {
      return `${this.day(start)} · ${this.time(start)} – ${this.time(end)}`;
    },
  };
}

const millisecondsPerDay = 86400000;
const relativeTime = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

export function daysAgo(value) {
  const days = Math.round((apiDate(value) - new Date()) / millisecondsPerDay);
  return capitalize(relativeTime.format(days, "day"));
}
