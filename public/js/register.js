import { getSession, setSession, request } from "./api.js";
import { errorMessage } from "./messages.js";
import { renderIcons } from "./icons.js";
import { setBusy, showAlert, bindPasswordToggle } from "./ui.js";
import { openSessionHome } from "./navigation.js";

const confirmationDelayMs = 1500;
const form = document.querySelector("#register-form");
const feedback = document.querySelector("#register-feedback");
const submitButton = document.querySelector("#register-submit");

function checkPasswordMatch() {
  const { password, confirmPassword } = form.elements;
  confirmPassword.setCustomValidity(
    confirmPassword.value === password.value
      ? ""
      : "Las contraseñas no coinciden.",
  );
}

async function createAccount(event) {
  event.preventDefault();
  feedback.hidden = true;
  setBusy(submitButton, true, "Creando tu cuenta…");
  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;
  try {
    await request("/users", {
      method: "POST",
      public: true,
      body: { name: form.elements.name.value.trim(), email, password },
    });
    const session = await request("/sessions", {
      method: "POST",
      public: true,
      body: { email, password },
    });
    setSession(session);
    showAlert(
      feedback,
      "success",
      "¡Cuenta creada con éxito! Te estamos llevando a tu espacio.",
    );
    setTimeout(() => openSessionHome(session), confirmationDelayMs);
  } catch (error) {
    showAlert(feedback, "error", errorMessage(error));
    setBusy(submitButton, false);
  }
}

const currentSession = getSession();
if (currentSession) openSessionHome(currentSession);
renderIcons();
bindPasswordToggle(
  document.querySelector("#password-toggle"),
  form.elements.password,
);
form.elements.password.addEventListener("input", checkPasswordMatch);
form.elements.confirmPassword.addEventListener("input", checkPasswordMatch);
form.addEventListener("submit", createAccount);
