import { getSession, setSession, request } from "./api.js";
import { errorMessage } from "./messages.js";
import { icon, renderIcons } from "./icons.js";
import { element, status } from "./ui.js";
import { menus, loginPage, homePageFor } from "./navigation.js";

function greeting(user) {
  if (user.role === "admin") return "admin";
  return `Hola, ${user.name.split(/\s+/)[0]}`;
}

function renderHeader(user) {
  const header = document.querySelector("#app-header");
  header.innerHTML = `
    <a class="wordmark" href="${homePageFor(user)}" aria-label="FitPulse, inicio"><span class="wordmark-accent">F</span>it<span class="wordmark-accent">P</span>ulse</a>
    <div class="account"><span id="account-greeting"></span>${user.role === "client" ? `<span class="account-avatar">${icon("user")}</span>` : ""}</div>`;
  header.querySelector("#account-greeting").textContent = greeting(user);
}

function renderSidebar(user) {
  const sidebar = document.querySelector("#sidebar");
  const current = document.body.dataset.menu || location.pathname;
  const nav = element("nav");
  nav.setAttribute("aria-label", "Navegación principal");
  for (const item of menus[user.role]) {
    const link = element("a");
    link.href = item.href;
    link.innerHTML = `${icon(item.icon)}<span>${item.label}</span>`;
    if (item.href === current) link.setAttribute("aria-current", "page");
    nav.append(link);
  }
  const logout = element("button", "logout-button");
  logout.type = "button";
  logout.innerHTML = `${icon("logout")}<span>Cerrar sesión</span>`;
  logout.addEventListener("click", () => setSession(null));
  sidebar.dataset.role = user.role;
  sidebar.replaceChildren(nav, logout);
}

function redirect(path) {
  location.replace(path);
}

export async function initializePage(load) {
  const session = getSession();
  if (!session) {
    redirect(loginPage);
    return;
  }
  const requiredRole = document.body.dataset.role;
  if (requiredRole && session.user.role !== requiredRole) {
    redirect(homePageFor(session.user));
    return;
  }
  window.addEventListener("sessionchange", (event) => {
    if (!event.detail) redirect(loginPage);
  });
  renderHeader(session.user);
  renderSidebar(session.user);
  renderIcons();
  try {
    const user = await request(`/users/${session.user.id}`);
    setSession({ accessToken: session.accessToken, user });
    renderHeader(user);
    await load();
  } catch (error) {
    if (getSession()) status("error", errorMessage(error));
  }
}
