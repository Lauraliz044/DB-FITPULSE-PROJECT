export const typeLabels = {
  maximum_weight: "Peso máximo",
  distance: "Distancia",
  duration: "Tiempo",
  repetitions: "Repeticiones",
};

export function typeLabel(value) {
  return typeLabels[value] || value;
}
