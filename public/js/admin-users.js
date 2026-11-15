import { request, listAll } from "./api.js";
import { errorMessage } from "./messages.js";
import { element, status, setBusy, renderStats } from "./ui.js";
import { scheduleFormatter } from "./format.js";
import { createPager } from "./pagination.js";
import { showResult } from "./modal.js";
import { initializePage } from "./shell.js";
import { openAttendance } from "./attendance.js";

const pageSize = 8;
const statusLabels = {
  active: { label: "Activo", tone: "positive", result: "activa" },
  inactive: { label: "Inactivo", tone: "negative", result: "inactiva" },
};
const rows = document.querySelector("#client-rows");
let schedule;
let clients = [];

function statusCell(client) {
  const cell = element("td");
  const wrapper = element("div", "status-cell");
  const { label, tone } = statusLabels[client.status];
  const toggle = element(
    "button",
    "button button-secondary button-small",
    "Cambiar estado",
  );
  toggle.type = "button";
  toggle.dataset.userId = client.id;
  toggle.setAttribute("aria-label", `Cambiar el estado de ${client.name}`);
  wrapper.append(
    element("span", `status-badge status-badge-${tone}`, label),
    toggle,
  );
  cell.append(wrapper);
  return cell;
}

function attendanceCell(client) {
  const cell = element("td");
  const button = element("button", "button button-small", "Ver asistencia");
  button.type = "button";
  button.dataset.attendanceUserId = client.id;
  button.setAttribute("aria-label", `Ver la asistencia de ${client.name}`);
  cell.append(button);
  return cell;
}

function clientRow(client) {
  const row = element("tr");
  row.append(
    element("td", "", client.name),
    element("td", "", client.email),
    element("td", "", schedule.shortDate(client.registered_at)),
    statusCell(client),
    attendanceCell(client),
  );
  return row;
}

const pager = createPager({
  pageSize,
  previous: document.querySelector("#previous-page"),
  next: document.querySelector("#next-page"),
  label: document.querySelector("#page-label"),
  render(visibleClients) {
    rows.replaceChildren(...visibleClients.map(clientRow));
  },
});

async function loadClients() {
  status("loading", "Cargando los clientes…");
  try {
    schedule ??= await scheduleFormatter();
    clients = (await listAll("/users")).filter(
      (user) => user.role === "client",
    );
    const active = clients.filter((user) => user.status === "active").length;
    renderStats([
      {
        value: clients.length,
        label:
          clients.length === 1 ? "cliente registrado" : "clientes registrados",
      },
      {
        value: active,
        label: active === 1 ? "cuenta activa" : "cuentas activas",
      },
      {
        value: clients.length - active,
        label:
          clients.length - active === 1
            ? "cuenta inactiva"
            : "cuentas inactivas",
      },
    ]);
    pager.setItems(clients);
    document.querySelector("#client-empty").hidden = clients.length > 0;
    status("", "");
  } catch (error) {
    status("error", errorMessage(error));
  }
}

async function toggleStatus(button) {
  const client = clients.find(
    (user) => user.id === Number(button.dataset.userId),
  );
  const nextStatus = client.status === "active" ? "inactive" : "active";
  setBusy(button, true, "Cambiando…");
  try {
    await request(`/users/${client.id}/status`, {
      method: "PATCH",
      body: { status: nextStatus },
    });
    await showResult(
      "success",
      "Estado actualizado",
      `La cuenta de ${client.name} ahora está ${statusLabels[nextStatus].result}.`,
    );
    await loadClients();
  } catch (error) {
    setBusy(button, false);
    await showResult(
      "error",
      "No pudimos cambiar el estado",
      errorMessage(error),
    );
  }
}

rows.addEventListener("click", (event) => {
  const statusButton = event.target.closest("button[data-user-id]");
  if (statusButton && !statusButton.disabled) {
    toggleStatus(statusButton);
    return;
  }
  const attendanceButton = event.target.closest(
    "button[data-attendance-user-id]",
  );
  if (!attendanceButton) return;
  const client = clients.find(
    (user) => user.id === Number(attendanceButton.dataset.attendanceUserId),
  );
  if (client) openAttendance(client);
});
initializePage(loadClients);
