import { getSession, request, listAll } from "./api.js";
import { errorMessage } from "./messages.js";
import {
  element,
  number,
  dateLabel,
  businessToday,
  status,
  showData,
  setBusy,
} from "./ui.js";
import { icon } from "./icons.js";
import { initializePage } from "./shell.js";
import { typeLabels, typeLabel } from "./record-types.js";

let records = [];
let activeLoad;
let editingId = null;
let deletingId = null;
let saving = false;

function groupKey(item) {
  return JSON.stringify([item.exercise, item.record_type, item.unit]);
}

function mountDialogs() {
  document.querySelector("#record-dialog").innerHTML = `
    <form id="record-form" class="dialog-form">
      <button class="icon-button dialog-close" type="button" data-close aria-label="Cerrar formulario">${icon("close")}</button>
      <span class="eyebrow">UN AVANCE MÁS EN TU HISTORIA</span><h2 id="record-heading">Nueva marca personal</h2>
      <p class="muted">Anota tu resultado con su fecha y unidad.</p>
      <label>Ejercicio<input name="exercise" maxlength="120" required placeholder="Por ejemplo, peso muerto"></label>
      <label>Tipo de marca<select name="recordType" required><option value="maximum_weight">Peso máximo</option><option value="distance">Distancia</option><option value="duration">Tiempo</option><option value="repetitions">Repeticiones</option><option value="other">Otro tipo</option></select></label>
      <label id="custom-type-field" hidden>Nombre del tipo<input name="customType" maxlength="45" placeholder="Describe qué estás midiendo"></label>
      <div class="form-grid"><label>Resultado<input name="value" type="number" min="0.001" max="999999999.999" step="0.001" required inputmode="decimal" placeholder="0"></label><label>Unidad<input name="unit" maxlength="45" required placeholder="kg" list="record-units"><datalist id="record-units"><option value="kg"><option value="lb"><option value="km"><option value="m"><option value="min"><option value="s"><option value="repeticiones"></datalist></label></div>
      <label>Fecha de la marca<input name="achievedOn" type="date" required></label>
      <p class="form-error" id="record-error" role="alert" hidden></p>
      <div class="dialog-buttons"><button class="button button-secondary" type="button" data-cancel>Cancelar</button><button class="button button-primary" id="save-record-button" type="submit">Guardar marca</button></div>
    </form>`;
  document.querySelector("#delete-dialog").innerHTML = `
    <form id="delete-form" class="dialog-form"><span class="eyebrow">REVISA ANTES DE CONTINUAR</span><h2 id="delete-heading">¿Eliminar esta marca?</h2><p class="delete-description">Se eliminará el registro de <strong id="delete-exercise"></strong>. Esta acción no se puede deshacer.</p><p class="form-error" id="delete-error" role="alert" hidden></p><div class="dialog-buttons"><button class="button button-secondary" type="button" data-cancel>Conservar marca</button><button class="button button-danger" id="confirm-delete-button" type="submit">Eliminar marca</button></div></form>`;
  const dialog = document.querySelector("#record-dialog");
  for (const selector of ["[data-close]", "[data-cancel]"])
    dialog
      .querySelector(selector)
      .addEventListener("click", () => dialog.close());
  document
    .querySelector("#delete-dialog [data-cancel]")
    .addEventListener("click", () =>
      document.querySelector("#delete-dialog").close(),
    );
  document
    .querySelector("#record-form")
    .elements.recordType.addEventListener("change", syncCustomType);
  document.querySelector("#record-form").addEventListener("submit", saveRecord);
  document
    .querySelector("#delete-form")
    .addEventListener("submit", deleteRecord);
}

function syncCustomType() {
  const form = document.querySelector("#record-form");
  const custom = form.elements.recordType.value === "other";
  document.querySelector("#custom-type-field").hidden = !custom;
  form.elements.customType.required = custom;
}

async function openRecord(item) {
  const session = getSession();
  if (!session) return;
  if (session.user.role !== "client") {
    status(
      "error",
      "Solo una cuenta de cliente puede registrar sus propias marcas.",
    );
    return;
  }
  const form = document.querySelector("#record-form");
  editingId = item?.id || null;
  form.reset();
  form.elements.exercise.value = item?.exercise || "";
  const knownType = item ? Object.hasOwn(typeLabels, item.record_type) : true;
  form.elements.recordType.value = item
    ? knownType
      ? item.record_type
      : "other"
    : "maximum_weight";
  form.elements.customType.value = item && !knownType ? item.record_type : "";
  form.elements.value.value = item?.value || "";
  form.elements.unit.value = item?.unit || "kg";
  const today = await businessToday();
  form.elements.achievedOn.max = today;
  form.elements.achievedOn.value = item?.achieved_on || today;
  document.querySelector("#record-heading").textContent = item
    ? "Editar marca personal"
    : "Nueva marca personal";
  document.querySelector("#record-error").hidden = true;
  syncCustomType();
  document.querySelector("#record-dialog").showModal();
}

async function saveRecord(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (saving || !form.reportValidity()) return;
  const session = getSession();
  if (!session) return;
  const button = document.querySelector("#save-record-button");
  const errorPanel = document.querySelector("#record-error");
  const body = {
    exercise: form.elements.exercise.value.trim(),
    recordType:
      form.elements.recordType.value === "other"
        ? form.elements.customType.value.trim()
        : form.elements.recordType.value,
    value: Number(form.elements.value.value),
    unit: form.elements.unit.value.trim(),
    achievedOn: form.elements.achievedOn.value,
  };
  const changed = Boolean(editingId);
  saving = true;
  setBusy(button, true);
  errorPanel.hidden = true;
  try {
    await request(
      editingId
        ? `/personal-records/${editingId}`
        : `/users/${session.user.id}/personal-records`,
      {
        method: editingId ? "PATCH" : "POST",
        body,
      },
    );
    if (getSession()?.accessToken !== session.accessToken) return;
    document.querySelector("#record-dialog").close();
    await load(
      changed
        ? "Tu marca se actualizó correctamente."
        : "Guardaste una nueva marca personal.",
    );
  } catch (error) {
    errorPanel.textContent = errorMessage(error);
    errorPanel.hidden = false;
  } finally {
    saving = false;
    setBusy(button, false);
  }
}

function openDelete(item) {
  deletingId = item.id;
  document.querySelector("#delete-exercise").textContent = item.exercise;
  document.querySelector("#delete-error").hidden = true;
  document.querySelector("#delete-dialog").showModal();
}

async function deleteRecord(event) {
  event.preventDefault();
  const session = getSession();
  if (!session || saving) return;
  saving = true;
  const button = document.querySelector("#confirm-delete-button");
  const errorPanel = document.querySelector("#delete-error");
  errorPanel.hidden = true;
  setBusy(button, true, "Eliminando…");
  try {
    await request(`/personal-records/${deletingId}`, { method: "DELETE" });
    if (getSession()?.accessToken !== session.accessToken) return;
    document.querySelector("#delete-dialog").close();
    await load("La marca se eliminó correctamente.");
  } catch (error) {
    errorPanel.textContent = errorMessage(error);
    errorPanel.hidden = false;
  } finally {
    saving = false;
    setBusy(button, false);
  }
}

function renderTable() {
  const search = document
    .querySelector("#search-records")
    .value.toLocaleLowerCase("es")
    .trim();
  const type = document.querySelector("#type-filter").value;
  const order = document.querySelector("#sort-records").value;
  const filtered = records.filter(
    (item) =>
      item.exercise.toLocaleLowerCase("es").includes(search) &&
      (!type || item.record_type === type),
  );
  filtered.sort((a, b) =>
    order === "exercise"
      ? a.exercise.localeCompare(b.exercise, "es")
      : (order === "oldest" ? 1 : -1) *
        (a.achieved_on.localeCompare(b.achieved_on) || a.id - b.id),
  );
  const body = document.querySelector("#records-body");
  body.replaceChildren();
  const canEdit = getSession()?.user.role === "client";
  for (const item of filtered) {
    const row = element("tr");
    const exercise = element("td");
    exercise.append(element("strong", "", item.exercise));
    const typeCell = element("td");
    typeCell.append(
      element("span", "record-type", typeLabel(item.record_type)),
    );
    const value = element("td");
    value.append(
      element("strong", "", number(Number(item.value))),
      element("span", "unit", item.unit),
    );
    const date = element(
      "td",
      "",
      dateLabel(item.achieved_on, { year: "numeric" }),
    );
    const actions = element("td");
    const buttons = element("div", "row-actions");
    for (const [action, title, symbol] of [
      ["edit", "Editar", "edit"],
      ["delete", "Eliminar", "trash"],
    ]) {
      const button = element(
        "button",
        `icon-button${action === "delete" ? " danger" : ""}`,
      );
      button.type = "button";
      button.dataset.action = action;
      button.dataset.id = item.id;
      button.setAttribute("aria-label", `${title} marca de ${item.exercise}`);
      button.innerHTML = icon(symbol);
      button.disabled = !canEdit;
      buttons.append(button);
    }
    actions.append(buttons);
    row.append(exercise, typeCell, value, date, actions);
    body.append(row);
  }
  document.querySelector("#records-table").hidden = !filtered.length;
  const empty = document.querySelector("#records-empty");
  empty.hidden = Boolean(filtered.length);
  empty.replaceChildren(
    element(
      "strong",
      "",
      records.length
        ? "No encontramos marcas con esos filtros."
        : "Tu primera marca empieza aquí.",
    ),
    element(
      "p",
      "",
      records.length
        ? "Prueba otro ejercicio o selecciona todos los tipos."
        : "Pulsa “Nueva marca” y registra un resultado que quieras seguir.",
    ),
  );
  document.querySelector("#table-count").textContent =
    `${number(filtered.length)} de ${number(records.length)} ${records.length === 1 ? "registro" : "registros"}`;
}

function renderTrend() {
  const parent = document.querySelector("#trend-chart");
  const key = document.querySelector("#trend-filter").value;
  const values = records
    .filter((item) => groupKey(item) === key)
    .sort((a, b) => a.achieved_on.localeCompare(b.achieved_on) || a.id - b.id)
    .slice(-6);
  parent.replaceChildren();
  if (!values.length) {
    const empty = element("div", "empty");
    empty.append(
      element("strong", "", "Cada registro agrega un punto de partida."),
      element("p", "", "Guarda una marca para empezar a ver tu evolución."),
    );
    parent.append(empty);
    return;
  }
  const maximum = Math.max(...values.map((item) => Number(item.value)));
  const chart = element("div", "trend-chart");
  chart.setAttribute("role", "img");
  chart.setAttribute(
    "aria-label",
    values
      .map(
        (item) =>
          `${dateLabel(item.achieved_on)}: ${number(Number(item.value))} ${item.unit}`,
      )
      .join(". "),
  );
  const labels = element("div", "chart-labels");
  for (const item of values) {
    const column = element("div", "chart-column");
    const bar = element("div", "chart-bar");
    bar.style.height = `${Math.max(3, (Number(item.value) / maximum) * 88)}px`;
    column.append(
      element(
        "span",
        "chart-count",
        `${number(Number(item.value))} ${item.unit}`,
      ),
      bar,
    );
    chart.append(column);
    labels.append(element("span", "", dateLabel(item.achieved_on)));
  }
  parent.append(chart, labels);
}

function render() {
  document.querySelector("#records-count").textContent = number(records.length);
  document.querySelector("#exercises-count").textContent = number(
    new Set(records.map((item) => item.exercise)).size,
  );
  const latest = [...records].sort((a, b) =>
    b.achieved_on.localeCompare(a.achieved_on),
  )[0];
  const latestNode = document.querySelector("#latest-record");
  latestNode.classList.add("date-value");
  latestNode.textContent = latest ? dateLabel(latest.achieved_on) : "—";
  document.querySelector("#latest-record-detail").textContent = latest
    ? dateLabel(latest.achieved_on, {
        day: undefined,
        month: undefined,
        year: "numeric",
      })
    : "Tu próximo registro puede ser hoy";
  const typeSelect = document.querySelector("#type-filter");
  const oldType = typeSelect.value;
  typeSelect.replaceChildren(new Option("Todos los tipos", ""));
  for (const type of [
    ...new Set(records.map((item) => item.record_type)),
  ].sort())
    typeSelect.append(new Option(typeLabel(type), type));
  if ([...typeSelect.options].some((option) => option.value === oldType))
    typeSelect.value = oldType;
  const trendSelect = document.querySelector("#trend-filter");
  const oldTrend = trendSelect.value;
  trendSelect.replaceChildren();
  const groups = new Map(records.map((item) => [groupKey(item), item]));
  for (const [key, item] of groups)
    trendSelect.append(
      new Option(
        `${item.exercise} · ${typeLabel(item.record_type)} · ${item.unit}`,
        key,
      ),
    );
  trendSelect.hidden = !records.length;
  if (groups.has(oldTrend)) trendSelect.value = oldTrend;
  renderTable();
  renderTrend();
}

async function load(message) {
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
  document.querySelector("#new-record-button").disabled =
    session.user.role !== "client";
  document.querySelector("#retry-button").hidden = true;
  status("loading", "Cargando tus marcas personales…");
  document.querySelector("#page-data").setAttribute("aria-busy", "true");
  try {
    const values = await listAll(
      `/users/${session.user.id}/personal-records`,
      signal,
    );
    if (signal.aborted || getSession()?.accessToken !== session.accessToken)
      return;
    records = values;
    render();
    showData(true);
    status(
      "success",
      typeof message === "string" ? message : "Tus marcas están actualizadas.",
    );
  } catch (error) {
    if (error.name !== "AbortError") {
      status("error", errorMessage(error));
      document.querySelector("#retry-button").hidden = !getSession();
    }
  } finally {
    if (activeLoad?.signal === signal) {
      refresh.disabled = false;
      document.querySelector("#page-data").setAttribute("aria-busy", "false");
    }
  }
}

mountDialogs();
document.querySelector("#records-body").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button || button.disabled) return;
  const item = records.find((value) => value.id === Number(button.dataset.id));
  if (!item) return;
  if (button.dataset.action === "edit")
    openRecord(item).catch((error) => status("error", errorMessage(error)));
  else openDelete(item);
});
document
  .querySelector("#new-record-button")
  .addEventListener("click", () =>
    openRecord().catch((error) => status("error", errorMessage(error))),
  );
for (const selector of ["#refresh-button", "#retry-button"])
  document.querySelector(selector).addEventListener("click", () => load());
for (const selector of ["#search-records", "#type-filter", "#sort-records"])
  document
    .querySelector(selector)
    .addEventListener(
      selector === "#search-records" ? "input" : "change",
      renderTable,
    );
document.querySelector("#trend-filter").addEventListener("change", renderTrend);
initializePage(load);
