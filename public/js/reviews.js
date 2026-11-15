import { getSession, listAll } from "./api.js";
import { errorMessage } from "./messages.js";
import {
  status,
  setBusy,
  showAlert,
  loadingState,
  emptyState,
  renderStats,
} from "./ui.js";
import { apiDate, scheduleFormatter } from "./format.js";
import { showResult } from "./modal.js";
import { avatar, reviewCard } from "./review-list.js";
import {
  renderStarInput,
  resetStars,
  fillClassOptions,
  submitReview,
} from "./review-form.js";
import { initializePage } from "./shell.js";

const grid = document.querySelector("#review-grid");
const listView = document.querySelector("#review-list-view");
const formView = document.querySelector("#review-form-view");
const switchButton = document.querySelector("#switch-view");
const form = document.querySelector("#review-form");
const feedback = document.querySelector("#review-feedback");
const sendButton = document.querySelector("#send-review");
const starInput = document.querySelector("#star-input");
let schedule;
let pendingReservations = [];

async function classReviews(scheduledClass) {
  const reviews = await listAll(`/classes/${scheduledClass.id}/reviews`);
  return reviews.map((review) => ({
    ...review,
    class_name: scheduledClass.name,
  }));
}

function renderReviews(reviews) {
  if (reviews.length) {
    grid.replaceChildren(...reviews.map(reviewCard));
    return;
  }
  grid.replaceChildren(
    emptyState({
      iconName: "star",
      title: "Todavía no hay reseñas",
      text: "Cuando asistas a una clase, cuéntale a la comunidad cómo te fue.",
    }),
  );
}

function renderReviewStats(reviews) {
  const average = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;
  const reviewedClasses = new Set(reviews.map((review) => review.class_id))
    .size;
  renderStats([
    {
      value: average ? average.toFixed(1) : "—",
      label: "promedio de 5 estrellas",
    },
    {
      value: reviews.length,
      label: reviews.length === 1 ? "reseña" : "reseñas",
    },
    {
      value: reviewedClasses,
      label: reviewedClasses === 1 ? "clase calificada" : "clases calificadas",
    },
  ]);
}

function prepareForm(attended, reviews, userId) {
  const reviewed = new Set(
    reviews
      .filter((review) => review.user_id === userId)
      .map((review) => review.class_id),
  );
  pendingReservations = attended.filter(
    (reservation) => !reviewed.has(reservation.class_id),
  );
  fillClassOptions(form.elements.classId, pendingReservations, schedule.day);
  document.querySelector("#review-hint").hidden =
    pendingReservations.length > 0;
  sendButton.disabled = pendingReservations.length === 0;
}

async function loadReviews() {
  grid.replaceChildren(loadingState("Cargando reseñas…"));
  status("", "");
  try {
    schedule ??= await scheduleFormatter();
    const userId = getSession().user.id;
    const now = new Date();
    const [classes, attended] = await Promise.all([
      listAll("/classes"),
      listAll(`/users/${userId}/reservations?status=attended`),
    ]);
    const finished = classes.filter((item) => apiDate(item.starts_at) <= now);
    const reviews = (await Promise.all(finished.map(classReviews)))
      .flat()
      .sort((first, second) =>
        second.created_at.localeCompare(first.created_at),
      );
    renderReviewStats(reviews);
    renderReviews(reviews);
    prepareForm(attended, reviews, userId);
  } catch (error) {
    grid.replaceChildren();
    status("error", errorMessage(error));
  }
}

function showForm(visible) {
  listView.hidden = visible;
  formView.hidden = !visible;
  switchButton.textContent = visible
    ? "Ver reseñas"
    : "Escribe tu reseña o comentario";
  feedback.hidden = true;
  form.reset();
  resetStars(starInput);
}

function fillAuthor() {
  const { user } = getSession();
  document
    .querySelector("#author-avatar")
    .replaceWith(avatar(user.name, user.id));
  document.querySelector("#author-name").textContent = user.name;
  document.querySelector("#author-email").textContent = user.email;
}

async function sendReview(event) {
  event.preventDefault();
  feedback.hidden = true;
  const { class_name: className } = pendingReservations.find(
    (reservation) =>
      reservation.class_id === Number(form.elements.classId.value),
  );
  setBusy(sendButton, true, "Enviando…");
  try {
    await submitReview(form);
    setBusy(sendButton, false);
    await showResult(
      "success",
      "¡Reseña publicada!",
      `Gracias por compartir tu experiencia en ${className}.`,
    );
    showForm(false);
    await loadReviews();
  } catch (error) {
    setBusy(sendButton, false);
    showAlert(feedback, "error", errorMessage(error));
  }
}

renderStarInput(starInput);
switchButton.addEventListener("click", () => showForm(!listView.hidden));
form.addEventListener("submit", sendReview);
initializePage(async () => {
  fillAuthor();
  await loadReviews();
});
