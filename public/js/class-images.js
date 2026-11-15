import { capitalize } from "./format.js";

const defaultImage = "/assets/gym.jpg";

const categoryImages = {
  yoga: "/assets/classes/yoga.jpg",
  spinning: "/assets/classes/spinning.jpg",
  crossfit: "/assets/classes/crossfit.jpg",
  zumba: "/assets/classes/zumba.jpg",
  trx: "/assets/classes/trx.jpg",
  estiramiento: "/assets/classes/estiramiento.jpg",
};

const categoryNames = {
  crossfit: "CrossFit",
  trx: "TRX",
};

export function imageFor(category) {
  return categoryImages[category.toLowerCase()] || defaultImage;
}

export function categoryName(category) {
  return categoryNames[category.toLowerCase()] || capitalize(category);
}
