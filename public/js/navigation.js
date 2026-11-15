export const loginPage = "/login.html";

const homePages = {
  client: "/home.html",
  admin: "/admin-sales.html",
};

export const menus = {
  client: [
    { href: "/home.html", label: "Inicio", icon: "home" },
    { href: "/catalog.html", label: "Catálogo", icon: "book" },
    { href: "/progress.html", label: "Mi progreso", icon: "pie" },
    { href: "/reservations.html", label: "Reservas", icon: "calendar" },
    { href: "/reviews.html", label: "Reseñas", icon: "message" },
    { href: "/packages.html", label: "Paquetes", icon: "cart" },
  ],
  admin: [
    { href: "/admin-sales.html", label: "Ventas", icon: "bag" },
    { href: "/admin-classes.html", label: "Gestión de clases", icon: "book" },
    { href: "/admin-users.html", label: "Gestión de usuarios", icon: "users" },
  ],
};

export function homePageFor(user) {
  return homePages[user.role] || loginPage;
}

export function openSessionHome(session) {
  location.replace(homePageFor(session.user));
}
