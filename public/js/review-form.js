import { request } from "./api.js";
import { element } from "./ui.js";
import { icon } from "./icons.js";

const maximumRating = 5;

function paintStars(fieldset, rating) {
  fieldset.querySelectorAll("label").forEach((label, index) => {
    label.classList.toggle("star-filled", index < rating);
  });
}

export function renderStarInput(fieldset) {
  for (let value = 1; value <= maximumRating; value += 1) {
    const label = element("label");
    const input = element("input");
    input.type = "radio";
    input.name = "rating";
    input.value = value;
    input.required = true;
    const star = element("span");
    star.innerHTML = icon("star");
    label.append(
      input,
      star,
      element(
        "span",
        "visually-hidden",
        `${value} ${value === 1 ? "estrella" : "estrellas"}`,
      ),
    );
    fieldset.append(label);
  }
  fieldset.addEventListener("change", (event) =>
    paintStars(fieldset, Number(event.target.value)),
  );
}

export function resetStars(fieldset) {
  paintStars(fieldset, 0);
}

export function fillClassOptions(select, reservations, formatDay) {
  select.replaceChildren(
    ...reservations.map(
      (reservation) =>
        new Option(
          `${reservation.class_name} · ${formatDay(reservation.starts_at)}`,
          reservation.class_id,
        ),
    ),
  );
  select.disabled = reservations.length === 0;
}

function parseTags(text) {
  const tags = text
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(tags)];
}

function reviewBody(form) {
  const body = {
    classId: Number(form.elements.classId.value),
    rating: Number(form.elements.rating.value),
  };
  const comment = form.elements.comment.value.trim();
  const tags = parseTags(form.elements.tags.value);
  if (comment) body.comment = comment;
  if (form.elements.intensity.value)
    body.intensity = form.elements.intensity.value;
  if (tags.length) body.tags = tags;
  return body;
}

export function submitReview(form) {
  return request("/reviews", { method: "POST", body: reviewBody(form) });
}
