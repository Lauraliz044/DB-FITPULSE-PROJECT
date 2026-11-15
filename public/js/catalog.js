import { request, listAll } from "./api.js";
import { errorMessage } from "./messages.js";
import {
  element,
  status,
  setBusy,
  loadingState,
  emptyState,
  renderStats,
} from "./ui.js";
import { money, apiDate, scheduleFormatter } from "./format.js";
import { categoryName } from "./class-images.js";
import { classCard, detail, toggleDescription } from "./class-card.js";
import { showResult } from "./modal.js";
import { initializePage } from "./shell.js";

const dayparts = [
  { value: "morning", label: "Mañana", until: 12 },
  { value: "afternoon", label: "Tarde", until: 18 },
  { value: "night", label: "Noche", until: 24 },
];
const grid = document.querySelector("#class-grid");
const filters = {
  category: document.querySelector("#category-filter"),
  instructor: document.querySelector("#instructor-filter"),
  daypart: document.querySelector("#daypart-filter"),
};
let schedule;
let classes = [];

function daypartOf(item) {
  const hour = schedule.hour(item.starts_at);
  return dayparts.find((daypart) => hour < daypart.until).value;
}

function fillFilter(select, values, label) {
  const selected = select.value;
  select.replaceChildren(
    new Option(select.options[0].text, ""),
    ...values.map((value) => new Option(label(value), value)),
  );
  select.value = values.includes(selected) ? selected : "";
}

function fillFilters() {
  const unique = (key) => [...new Set(classes.map((item) => item[key]))].sort();
  fillFilter(filters.category, unique("category"), categoryName);
  fillFilter(filters.instructor, unique("instructor_name"), String);
  fillFilter(
    filters.daypart,
    dayparts.map((daypart) => daypart.value),
    (value) => dayparts.find((daypart) => daypart.value === value).label,
  );
}

function matchesFilters(item) {
  return (
    (!filters.category.value || item.category === filters.category.value) &&
    (!filters.instructor.value ||
      item.instructor_name === filters.instructor.value) &&
    (!filters.daypart.value || daypartOf(item) === filters.daypart.value)
  );
}

function catalogItem(item) {
  const wrapper = element("article", "class-item");
  const card = classCard(item, [
    detail("Disciplina", categoryName(item.category)),
    detail("Instructor", item.instructor_name),
    detail("Día", schedule.day(item.starts_at)),
    detail(
      "Hora",
      `${schedule.time(item.starts_at)} – ${schedule.time(item.ends_at)}`,
    ),
    detail(
      "Cupos",
      `${item.capacity - item.available_spots}/${item.capacity} ocupados`,
    ),
    detail("Precio", money(item.price)),
  ]);
  const reserveButton = element("button", "button", "Reservar");
  reserveButton.type = "button";
  reserveButton.dataset.action = "reserve";
  reserveButton.dataset.classId = item.id;
  wrapper.append(card, reserveButton);
  return wrapper;
}

function renderClasses() {
  const visible = classes.filter(matchesFilters);
  if (visible.length) {
    grid.replaceChildren(...visible.map(catalogItem));
    return;
  }
  grid.replaceChildren(
    classes.length
      ? emptyState({
          iconName: "book",
          title: "Sin resultados",
          text: "No hay clases que coincidan con los filtros elegidos. Prueba con otra disciplina u horario.",
        })
      : emptyState({
          iconName: "calendar",
          title: "Aún no hay clases programadas",
          text: "Pronto el gimnasio publicará nuevas clases. Mientras tanto, revisa los paquetes disponibles.",
          action: { href: "/packages.html", label: "Ver paquetes" },
        }),
  );
}

function renderCatalogStats() {
  const freeSpots = classes.reduce(
    (sum, item) => sum + item.available_spots,
    0,
  );
  const disciplines = new Set(classes.map((item) => item.category)).size;
  renderStats([
    {
      value: classes.length,
      label: classes.length === 1 ? "clase disponible" : "clases disponibles",
    },
    {
      value: disciplines,
      label: disciplines === 1 ? "disciplina" : "disciplinas",
    },
    {
      value: freeSpots,
      label: freeSpots === 1 ? "cupo libre" : "cupos libres",
    },
  ]);
}

async function loadClasses() {
  grid.replaceChildren(loadingState("Cargando clases…"));
  status("", "");
  try {
    schedule ??= await scheduleFormatter();
    const now = new Date();
    classes = (await listAll("/classes")).filter(
      (item) => apiDate(item.starts_at) > now,
    );
    fillFilters();
    renderCatalogStats();
    renderClasses();
  } catch (error) {
    grid.replaceChildren();
    status("error", errorMessage(error));
  }
}

async function reserve(button) {
  const item = classes.find(
    (value) => value.id === Number(button.dataset.classId),
  );
  setBusy(button, true, "Reservando…");
  try {
    await request("/reservations", {
      method: "POST",
      body: { classId: item.id },
    });
    await showResult(
      "success",
      "¡Reserva exitosa!",
      `Tu reserva de la clase ${item.name} del ${schedule.day(item.starts_at)} a las ${schedule.time(item.starts_at)} fue exitosa.`,
    );
    await loadClasses();
  } catch (error) {
    setBusy(button, false);
    const title =
      error.message === "The class is full"
        ? `Sin cupos para “${item.name}”`
        : "No pudimos completar tu reserva";
    await showResult("error", title, errorMessage(error));
  }
}

grid.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button || button.disabled) return;
  if (button.dataset.action === "describe") toggleDescription(button);
  else reserve(button);
});
Object.values(filters).forEach((select) =>
  select.addEventListener("change", renderClasses),
);
initializePage(loadClasses);
