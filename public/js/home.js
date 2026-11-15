import { getSession, request, listAll } from "./api.js";
import { errorMessage } from "./messages.js";
import { element, number, status, loadingState } from "./ui.js";
import { apiDate, daysAgo, scheduleFormatter } from "./format.js";
import { categoryName } from "./class-images.js";
import { typeLabel } from "./record-types.js";
import { initializePage } from "./shell.js";

const latestRecordCount = 2;
const bodies = {
  streak: document.querySelector("#streak-body"),
  totals: document.querySelector("#totals-body"),
  records: document.querySelector("#records-body"),
};
let schedule;

function plural(count, singular, pluralForm) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function renderStreak({ weeklyStreak }) {
  bodies.streak.replaceChildren(
    element(
      "p",
      "summary-highlight",
      plural(weeklyStreak, "semana", "semanas"),
    ),
  );
  if (!weeklyStreak) {
    bodies.streak.append(
      element("p", "", "Asiste a una clase esta semana para empezar tu racha."),
    );
    return;
  }
  bodies.streak.append(
    element("p", "", "¡Vas muy bien!"),
    element(
      "p",
      "",
      "Has asistido al menos a una clase por semana de forma consecutiva.",
    ),
  );
}

function renderTotals({ categoryTotals, totalAttended }) {
  const categories = Object.entries(categoryTotals).sort(
    (first, second) => second[1] - first[1],
  );
  if (!categories.length) {
    bodies.totals.replaceChildren(
      element("p", "empty-state", "Aún no tienes clases asistidas."),
    );
    return;
  }
  bodies.totals.replaceChildren(
    ...categories.map(([category, count]) =>
      element(
        "p",
        "",
        `${categoryName(category)}: ${plural(count, "clase", "clases")} (${Math.round((count / totalAttended) * 100)} %)`,
      ),
    ),
    element(
      "p",
      "",
      `Categoría más visitada: ${categoryName(categories[0][0])}`,
    ),
  );
}

function renderRecords(records) {
  const latest = [...records]
    .sort((first, second) =>
      second.achieved_on.localeCompare(first.achieved_on),
    )
    .slice(0, latestRecordCount);
  if (!latest.length) {
    const link = element("a", "", "Registra tu primera marca");
    link.href = "/personal-records.html";
    const message = element("p", "empty-state", "Todavía no tienes marcas. ");
    message.append(link, ".");
    bodies.records.replaceChildren(message);
    return;
  }
  bodies.records.replaceChildren(
    ...latest.map((record) =>
      element(
        "p",
        "",
        `${typeLabel(record.record_type)}: ${number(Number(record.value))} ${record.unit} en ${record.exercise}`,
      ),
    ),
    element(
      "p",
      "",
      `Última actualización: ${daysAgo(`${latest[0].achieved_on} 12:00:00`).toLowerCase()}`,
    ),
  );
}

function renderNextClass(reservations, classes) {
  const now = new Date();
  const next = reservations
    .filter((reservation) => apiDate(reservation.starts_at) > now)
    .sort((first, second) =>
      first.starts_at.localeCompare(second.starts_at),
    )[0];
  const text = document.querySelector("#next-class-text");
  if (!next) {
    text.textContent =
      "No tienes clases reservadas. ¡Elige tu próxima clase en el catálogo!";
    return;
  }
  const instructor = classes.find(
    (item) => item.id === next.class_id,
  )?.instructor_name;
  const day = schedule.isToday(next.starts_at)
    ? "Hoy"
    : schedule.day(next.starts_at);
  text.textContent = `Próxima clase: ${next.class_name}${instructor ? ` con ${instructor}` : ""} — ${day}, ${schedule.time(next.starts_at)}`;
}

async function loadHome() {
  const { user } = getSession();
  document.querySelector("#page-title").textContent =
    `Hola, ${user.name.split(/\s+/)[0]}`;
  Object.values(bodies).forEach((body) =>
    body.replaceChildren(loadingState("Cargando…")),
  );
  try {
    schedule ??= await scheduleFormatter();
    const route = `/users/${user.id}`;
    const [progress, records, reservations, classes] = await Promise.all([
      request(`${route}/progress`),
      listAll(`${route}/personal-records`),
      listAll(`${route}/reservations?status=reserved`),
      listAll("/classes"),
    ]);
    renderStreak(progress);
    renderTotals(progress);
    renderRecords(records);
    renderNextClass(reservations, classes);
  } catch (error) {
    Object.values(bodies).forEach((body) => body.replaceChildren());
    status("error", errorMessage(error));
  }
}

initializePage(loadHome);
