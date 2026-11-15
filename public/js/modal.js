import { element } from "./ui.js";

let dialog;

function createDialog() {
  dialog = element("dialog", "modal");
  dialog.setAttribute("aria-labelledby", "result-title");
  const title = element("h2");
  title.id = "result-title";
  const message = element("p");
  const actions = element("div", "modal-actions");
  const closeButton = element("button", "button button-secondary", "VOLVER");
  closeButton.type = "button";
  closeButton.addEventListener("click", () => dialog.close());
  actions.append(closeButton);
  dialog.append(title, message, actions);
  document.body.append(dialog);
}

export function showResult(kind, title, message) {
  if (!dialog) createDialog();
  dialog.className = `modal modal-${kind}`;
  dialog.querySelector("h2").textContent = title;
  dialog.querySelector("p").textContent = message;
  dialog.showModal();
  return new Promise((resolve) =>
    dialog.addEventListener("close", resolve, { once: true }),
  );
}
