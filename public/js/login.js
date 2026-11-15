import { getSession, setSession, request } from "./api.js";
import { errorMessage } from "./messages.js";
import { renderIcons } from "./icons.js";
import { setBusy, showAlert, bindPasswordToggle } from "./ui.js";
import { openSessionHome } from "./navigation.js";

const form = document.querySelector("#login-form");
const feedback = document.querySelector("#login-feedback");
const submitButton = document.querySelector("#login-submit");

async function signIn(event) {
  event.preventDefault();
  feedback.hidden = true;
  setBusy(submitButton, true, "Iniciando sesión…");
  try {
    const session = await request("/sessions", {
      method: "POST",
      public: true,
      body: {
        email: form.elements.email.value.trim(),
        password: form.elements.password.value,
      },
    });
    setSession(session);
    openSessionHome(session);
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
form.addEventListener("submit", signIn);
