import { element } from "./ui.js";
import { imageFor, categoryName } from "./class-images.js";

export function detail(label, value) {
  const line = element("p");
  line.append(element("strong", "", `${label}: `), value);
  return line;
}

function classPhoto(category, description) {
  const photo = element("figure", "class-photo");
  const image = element("img");
  image.src = imageFor(category);
  image.alt = `Clase de ${categoryName(category)}`;
  const text = element("p", "class-description", description);
  text.hidden = true;
  const toggle = element("button", "description-toggle", "ver descripción");
  toggle.type = "button";
  toggle.dataset.action = "describe";
  toggle.setAttribute("aria-expanded", "false");
  photo.append(image, text, toggle);
  return photo;
}

export function classCard({ name, category, description }, details) {
  const card = element("div", "class-card");
  const detailList = element("div", "class-details");
  detailList.append(...details);
  card.append(
    element("h2", "", name),
    classPhoto(category, description),
    detailList,
  );
  return card;
}

export function toggleDescription(button) {
  const text = button.parentElement.querySelector(".class-description");
  text.hidden = !text.hidden;
  button.textContent = text.hidden ? "ver descripción" : "ocultar";
  button.setAttribute("aria-expanded", String(!text.hidden));
}
