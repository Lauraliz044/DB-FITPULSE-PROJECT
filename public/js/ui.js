import { getConfiguration } from "./api.js";
import { icon } from "./icons.js";

export function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function number(value, maximumFractionDigits = 3) {
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits }).format(
    value,
  );
}

export async function businessToday() {
  const { timeZone } = await getConfiguration();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

export function dateLabel(value, options = {}) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    ...options,
  }).format(new Date(`${value.slice(0, 10)}T12:00:00Z`));
}

export function status(kind, message) {
  const panel = document.querySelector("#page-status");
  panel.className = `notice notice-${kind}`;
  panel.textContent = message;
  panel.hidden = !message;
}

export function showData(show) {
  document.querySelector("#page-data").hidden = !show;
}

export function setBusy(button, busy, label = "Guardando…") {
  if (busy) {
    button.dataset.label = button.textContent;
    button.textContent = label;
  } else {
    button.textContent = button.dataset.label;
  }
  button.disabled = busy;
}

export function showAlert(panel, kind, message) {
  panel.classList.toggle("alert-error", kind === "error");
  panel.classList.toggle("alert-success", kind === "success");
  panel.querySelector(".alert-text").textContent = message;
  panel.hidden = false;
}

export function bindPasswordToggle(button, input) {
  const render = () => {
    const visible = input.type === "text";
    button.innerHTML = icon(visible ? "eye" : "eyeOff");
    button.setAttribute("aria-pressed", String(visible));
    button.setAttribute(
      "aria-label",
      visible ? "Ocultar contraseña" : "Mostrar contraseña",
    );
  };
  button.addEventListener("click", () => {
    input.type = input.type === "password" ? "text" : "password";
    render();
  });
  render();
}

export function loadingState(message) {
  const loading = element("div", "loading-state");
  loading.append(element("span", "spinner"), element("p", "", message));
  return loading;
}

export function emptyState({ iconName, title, text, action }) {
  const panel = element("div", "empty-panel");
  const symbol = element("span", "empty-icon");
  symbol.innerHTML = icon(iconName);
  panel.append(symbol, element("strong", "", title), element("p", "", text));
  if (action) {
    const link = element("a", "button button-small", action.label);
    link.href = action.href;
    panel.append(link);
  }
  return panel;
}

export function renderStats(items) {
  document.querySelector("#page-stats").replaceChildren(
    ...items.map(({ value, label }) => {
      const chip = element("div", "stat-chip");
      chip.append(element("strong", "", value), element("span", "", label));
      return chip;
    }),
  );
}
