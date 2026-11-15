import { listAll, request } from "./api.js";
import { errorMessage } from "./messages.js";
import { element, setBusy, loadingState } from "./ui.js";
import { apiDate, capitalize, scheduleFormatter } from "./format.js";
import { showResult } from "./modal.js";
import { icon } from "./icons.js";

const attendanceLabels = {
  reserved: { label: "Pendiente", tone: "neutral" },
  attended: { label: "Asistió", tone: "positive" },
  no_show: { label: "No asistió", tone: "negative" },
};
const attendanceChoices = [
  { status: "attended", className: "button button-small" },
  { status: "no_show", className: "button button-secondary button-small" },
];

let dialog;
let heading;
let content;
let schedule;
let currentClient;

function createDialog() {
  dialog = element("dialog", "form-dialog attendance-dialog");
  dialog.setAttribute("aria-labelledby", "attendance-title");
  const panel = element("div", "dialog-form");
  const closeButton = element("button", "icon-button dialog-close");
  closeButton.type = "button";
  closeButton.innerHTML = icon("close");
  closeButton.setAttribute("aria-label", "Cerrar asistencia");
  closeButton.addEventListener("click", () => dialog.close());
  heading = element("h2");
  heading.id = "attendance-title";
  const description = element(
    "p",
    "muted",
    "Registra si el cliente asistió a las clases que ya terminaron. Una vez registrada, la asistencia no se puede cambiar.",
  );
  content = element("div", "attendance-content");
  content.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-reservation-id]");
    if (button && !button.disabled) recordAttendance(button);
  });
  panel.append(closeButton, heading, description, content);
  dialog.append(panel);
  document.body.append(dialog);
}

function attendanceButton(reservation, choice) {
  const { label } = attendanceLabels[choice.status];
  const button = element("button", choice.className, label);
  button.type = "button";
  button.dataset.reservationId = reservation.id;
  button.dataset.status = choice.status;
  button.dataset.className = reservation.class_name;
  button.setAttribute("aria-label", `${label} a ${reservation.class_name}`);
  return button;
}

function reservationItem(reservation) {
  const item = element("li", "attendance-item");
  const details = element("div", "attendance-details");
  details.append(
    element("strong", "", reservation.class_name),
    element(
      "span",
      "",
      `${capitalize(reservation.category)} · ${schedule.range(reservation.starts_at, reservation.ends_at)}`,
    ),
  );
  const actions = element("div", "attendance-actions");
  if (reservation.status === "reserved") {
    actions.append(
      ...attendanceChoices.map((choice) =>
        attendanceButton(reservation, choice),
      ),
    );
  } else {
    const { label, tone } = attendanceLabels[reservation.status];
    actions.append(element("span", `status-badge status-badge-${tone}`, label));
  }
  item.append(details, actions);
  return item;
}

async function loadReservations() {
  content.replaceChildren(loadingState("Cargando las reservas…"));
  try {
    const reservations = await listAll(
      `/users/${currentClient.id}/reservations`,
    );
    const now = new Date();
    const finished = reservations
      .filter((reservation) => apiDate(reservation.ends_at) <= now)
      .sort(
        (first, second) => apiDate(second.starts_at) - apiDate(first.starts_at),
      );
    if (!finished.length) {
      content.replaceChildren(
        element(
          "p",
          "empty-state",
          "Este cliente todavía no tiene clases terminadas para registrar asistencia.",
        ),
      );
      return;
    }
    const list = element("ul", "attendance-list");
    list.append(...finished.map(reservationItem));
    content.replaceChildren(list);
  } catch (error) {
    content.replaceChildren(
      element("p", "notice notice-error", errorMessage(error)),
    );
  }
}

async function recordAttendance(button) {
  const nextStatus = button.dataset.status;
  const siblingButtons = [...button.parentElement.querySelectorAll("button")];
  siblingButtons.forEach((sibling) => {
    sibling.disabled = true;
  });
  setBusy(button, true, "Guardando…");
  try {
    await request(`/reservations/${button.dataset.reservationId}/attendance`, {
      method: "PATCH",
      body: { status: nextStatus },
    });
    await showResult(
      "success",
      "Asistencia registrada",
      `${currentClient.name} quedó registrado como «${attendanceLabels[nextStatus].label}» en ${button.dataset.className}.`,
    );
    await loadReservations();
  } catch (error) {
    setBusy(button, false);
    siblingButtons.forEach((sibling) => {
      sibling.disabled = false;
    });
    await showResult(
      "error",
      "No pudimos registrar la asistencia",
      errorMessage(error),
    );
  }
}

export async function openAttendance(client) {
  if (!dialog) createDialog();
  currentClient = client;
  heading.textContent = `Asistencia de ${client.name}`;
  dialog.showModal();
  try {
    schedule ??= await scheduleFormatter();
  } catch (error) {
    content.replaceChildren(
      element("p", "notice notice-error", errorMessage(error)),
    );
    return;
  }
  await loadReservations();
}
