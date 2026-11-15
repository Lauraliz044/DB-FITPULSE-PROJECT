import { getSession, request, listAll, getConfiguration } from "./api.js";
import { errorMessage } from "./messages.js";
import {
  element,
  number,
  dateLabel,
  businessToday,
  status,
  showData,
} from "./ui.js";
import { icon } from "./icons.js";
import { initializePage } from "./shell.js";
import { calendarDays, categoryShares } from "./progress-data.js";

let attended = [];
let activeLoad;
let today;
let timeZone;
let weekOffset = 0;

function classDate(value) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(`${value.replace(" ", "T")}Z`));
  const fields = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${fields.year}-${fields.month}-${fields.day}`;
}

function empty(parent, title, description) {
  const node = element("div", "empty");
  node.append(element("strong", "", title), element("p", "", description));
  parent.replaceChildren(node);
}

function renderActivity() {
  const parent = document.querySelector("#activity-chart");
  const days = calendarDays(
    today,
    attended.map((item) => classDate(item.starts_at)),
    weekOffset,
  );
  document.querySelector("#calendar-week").textContent =
    `${dateLabel(days[0].date)} – ${dateLabel(days[6].date, { year: "numeric" })}`;
  document.querySelector("#next-week").disabled = weekOffset >= 0;
  const grid = element("ol", "attendance-calendar");
  for (const [index, day] of days.entries()) {
    const tile = element(
      "li",
      `calendar-day${day.count ? " attended" : ""}${day.today ? " is-today" : ""}`,
    );
    tile.setAttribute(
      "aria-label",
      `${dateLabel(day.date, { year: "numeric" })}: ${day.count} ${day.count === 1 ? "clase asistida" : "clases asistidas"}${day.today ? ", hoy" : ""}`,
    );
    if (day.today) tile.setAttribute("aria-current", "date");
    tile.append(
      element("span", "day-name", ["L", "M", "Mi", "J", "V", "S", "D"][index]),
      element("strong", "day-number", day.date.slice(8)),
    );
    const check = element("span", "day-check");
    if (day.count) check.innerHTML = icon("check");
    check.setAttribute("aria-hidden", "true");
    tile.append(check);
    grid.append(tile);
  }
  parent.replaceChildren(grid);
  if (!attended.length)
    parent.append(
      element(
        "p",
        "calendar-empty",
        "Aún no tienes asistencias confirmadas. Tu calendario se llenará cuando el administrador las registre.",
      ),
    );
}

function renderCategories(totals) {
  const parent = document.querySelector("#category-list");
  const categories = categoryShares(totals);
  if (!categories.length) {
    empty(
      parent,
      "Aún no hay categorías registradas.",
      "Se calculan a partir de tus clases asistidas.",
    );
    return;
  }
  parent.replaceChildren();
  const colors = [
    "#e5c92f",
    "#2e57ae",
    "#b4b6ba",
    "#6d8174",
    "#bd6b44",
    "#8a68aa",
  ];
  const pie = element("div", "category-pie");
  pie.setAttribute("role", "img");
  pie.setAttribute(
    "aria-label",
    categories
      .map(
        ({ name, count, percent }) =>
          `${name}: ${count} clases, ${number(percent, 1)} %`,
      )
      .join(". "),
  );
  let cursor = 0;
  const stops = categories.map(({ percent }, index) => {
    const start = cursor;
    cursor += percent;
    return `${colors[index % colors.length]} ${start}% ${cursor}%`;
  });
  pie.style.background = `conic-gradient(${stops.join(",")})`;
  const legend = element("ul", "category-legend");
  for (const [{ name, count, percent }, index] of categories.map(
    (value, index) => [value, index],
  )) {
    const row = element("li");
    const swatch = element("span", "legend-dot");
    swatch.style.backgroundColor = colors[index % colors.length];
    swatch.setAttribute("aria-hidden", "true");
    row.append(
      swatch,
      element("span", "category-name", name),
      element("strong", "", `${number(percent, 1)} %`),
      element("span", "category-total", `(${number(count)})`),
    );
    legend.append(row);
  }
  parent.append(pie, legend);
}

function renderRecords(records) {
  const parent = document.querySelector("#records-summary");
  const latest = [...records]
    .sort((a, b) => b.achieved_on.localeCompare(a.achieved_on) || b.id - a.id)
    .slice(0, 2);
  parent.replaceChildren();
  if (!latest.length)
    parent.append(
      element(
        "p",
        "",
        "Todavía no has guardado marcas. Pulsa Editar para registrar la primera.",
      ),
    );
  for (const item of latest)
    parent.append(
      element(
        "p",
        "",
        `${item.exercise}: ${number(Number(item.value))} ${item.unit} · ${dateLabel(item.achieved_on, { year: "numeric" })}`,
      ),
    );
}

function renderClasses(values, selector, future) {
  const parent = document.querySelector(selector);
  parent.replaceChildren();
  if (!values.length) {
    empty(
      parent,
      future ? "Sin próximas reservas." : "Tu historial está por comenzar.",
      future
        ? "Cuando reserves una clase futura, la verás aquí."
        : "Aquí encontrarás tus clases con asistencia confirmada.",
    );
    return;
  }
  for (const item of values.slice(0, future ? 3 : 5)) {
    const row = element("div", "history-row");
    const date = classDate(item.starts_at);
    const symbol = element("span", future ? "upcoming-date" : "class-symbol");
    if (future) {
      symbol.append(
        element("strong", "", new Date(`${date}T12:00:00Z`).getUTCDate()),
        element("span", "", dateLabel(date, { day: undefined })),
      );
    } else symbol.innerHTML = icon("pulse");
    const info = element("div", "history-info");
    info.append(
      element("strong", "", item.class_name),
      element(
        "span",
        "",
        `${item.category} · ${dateLabel(date, { year: "numeric" })}`,
      ),
    );
    row.append(symbol, info);
    if (!future) row.append(element("span", "badge", "Asistida"));
    parent.append(row);
  }
}

async function load() {
  activeLoad?.abort();
  const session = getSession();
  if (!session) {
    showData(false);
    return;
  }
  activeLoad = new AbortController();
  const signal = activeLoad.signal;
  const refresh = document.querySelector("#refresh-button");
  refresh.disabled = true;
  document.querySelector("#previous-week").disabled = true;
  document.querySelector("#next-week").disabled = true;
  document.querySelector("#retry-button").hidden = true;
  status("loading", "Cargando tu progreso y tus clases…");
  showData(true);
  for (const selector of [
    "#activity-chart",
    "#category-list",
    "#records-summary",
    "#attended-list",
    "#upcoming-list",
  ]) {
    const message = element("p", "panel-loading", "Cargando tu progreso…");
    document.querySelector(selector).replaceChildren(message);
  }
  document.querySelector("#page-data").setAttribute("aria-busy", "true");
  try {
    ({ timeZone } = await getConfiguration());
    today = await businessToday();
    const route = `/users/${session.user.id}`;
    const [progress, past, reserved, records] = await Promise.all([
      request(`${route}/progress`, { signal }),
      listAll(`${route}/reservations?status=attended`, signal),
      listAll(`${route}/reservations?status=reserved`, signal),
      listAll(`${route}/personal-records`, signal),
    ]);
    if (signal.aborted || session.accessToken !== getSession()?.accessToken)
      return;
    attended = past;
    document.querySelector("#total-attended").textContent = number(
      progress.totalAttended,
    );
    document.querySelector("#weekly-streak").textContent = number(
      progress.weeklyStreak,
    );
    document.querySelector("#category-count").textContent = number(
      Object.keys(progress.categoryTotals).length,
    );
    renderActivity();
    renderCategories(progress.categoryTotals);
    renderRecords(records);
    renderClasses(
      [...past].sort((a, b) => b.starts_at.localeCompare(a.starts_at)),
      "#attended-list",
      false,
    );
    const upcoming = reserved
      .filter(
        (item) => new Date(`${item.starts_at.replace(" ", "T")}Z`) > new Date(),
      )
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    renderClasses(upcoming, "#upcoming-list", true);
    showData(true);
    status("success", "Tu progreso está actualizado.");
  } catch (error) {
    if (error.name !== "AbortError") {
      showData(false);
      status("error", errorMessage(error));
      document.querySelector("#retry-button").hidden = !getSession();
    }
  } finally {
    if (activeLoad?.signal === signal) {
      refresh.disabled = false;
      document.querySelector("#previous-week").disabled = false;
      document.querySelector("#next-week").disabled = weekOffset >= 0;
      document.querySelector("#page-data").setAttribute("aria-busy", "false");
    }
  }
}

document.querySelector("#previous-week").addEventListener("click", () => {
  weekOffset -= 1;
  renderActivity();
});
document.querySelector("#next-week").addEventListener("click", () => {
  if (weekOffset < 0) weekOffset += 1;
  renderActivity();
});
for (const selector of ["#refresh-button", "#retry-button"])
  document.querySelector(selector).addEventListener("click", load);
initializePage(load);
