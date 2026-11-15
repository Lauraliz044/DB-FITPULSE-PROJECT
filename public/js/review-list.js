import { element } from "./ui.js";
import { icon } from "./icons.js";
import { daysAgo } from "./format.js";

const maximumRating = 5;
const avatarColors = ["#f7c9d4", "#c7d7f6", "#c9eee6", "#f3efc0", "#d9cdf3"];
const intensityLabels = { low: "Baja", moderate: "Moderada", high: "Alta" };

export function avatar(name, colorIndex) {
  const circle = element("span", "review-avatar", name.charAt(0).toUpperCase());
  circle.style.backgroundColor = avatarColors[colorIndex % avatarColors.length];
  circle.setAttribute("aria-hidden", "true");
  return circle;
}

function starIcons(rating) {
  const stars = element("span", "stars");
  stars.setAttribute("role", "img");
  stars.setAttribute("aria-label", `${rating} de ${maximumRating} estrellas`);
  for (let position = 1; position <= maximumRating; position += 1) {
    const star = element("span", position <= rating ? "star-filled" : "");
    star.innerHTML = icon("star");
    stars.append(star);
  }
  return stars;
}

function extraDetails(review) {
  const parts = [];
  if (review.intensity)
    parts.push(`Intensidad: ${intensityLabels[review.intensity]}`);
  if (review.tags.length) parts.push(`Etiquetas: ${review.tags.join(", ")}`);
  return parts.join(" · ");
}

export function reviewCard(review) {
  const authorName = review.author_name || "Cliente";
  const card = element("article", "review-card");
  const author = element("div", "review-author");
  const identity = element("div");
  identity.append(
    element("strong", "", authorName),
    element("span", "", daysAgo(review.created_at)),
  );
  author.append(avatar(authorName, review.user_id), identity);
  const meta = element("div", "review-meta");
  meta.append(
    starIcons(review.rating),
    element("span", "review-class", review.class_name),
  );
  card.append(author, meta);
  if (review.comment)
    card.append(element("p", "review-comment", review.comment));
  const extra = extraDetails(review);
  if (extra) card.append(element("p", "review-extra", extra));
  return card;
}
