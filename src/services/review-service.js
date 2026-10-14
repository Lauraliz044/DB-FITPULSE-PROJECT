const repository = require('../repositories/review-repository');
const reservations = require('../repositories/reservation-repository');
const classes = require('../repositories/class-repository');
const check = require('../utils/validation');
const { fail, found, allowOwner } = require('../utils/errors');

const names = ['rating', 'comment', 'intensity', 'tags'];

function validate(body) {
  check.fields(body, names, ['rating']);
  const rating = check.integer(body.rating, 'rating', 1, 5);
  const comment = body.comment === undefined ? null :
    check.text(body.comment, 'comment', 2000, true);
  const intensity = body.intensity === undefined || body.intensity === null ? null :
    check.choice(body.intensity, 'intensity', ['low', 'moderate', 'high']);
  const tags = body.tags === undefined ? [] : body.tags;
  if (!Array.isArray(tags) || tags.length > 10) fail(400, 'tags must be an array of at most 10 strings');
  const normalizedTags = tags.map((tag) => check.text(tag, 'tag', 40).toLowerCase());
  if (new Set(normalizedTags).size !== normalizedTags.length) fail(400, 'tags cannot contain duplicates');
  return { rating, comment, intensity, tags: normalizedTags };
}

async function create(body, user) {
  check.fields(body, ['reservationId', ...names], ['reservationId', 'rating']);
  const reservationId = check.integer(body.reservationId, 'reservationId');
  const reviewBody = { ...body };
  delete reviewBody.reservationId;
  const data = validate(reviewBody);
  const item = found(await reservations.findById(reservationId), 'Reservation');
  allowOwner(user, item.user_id, false);
  if (item.status !== 'attended') fail(409, 'Only attended classes can be reviewed');
  return repository.create({ ...data, reservationId });
}

async function get(id) {
  return found(await repository.findById(id), 'Review');
}

async function list(classId, query) {
  const page = check.pagination(query);
  found(await classes.findById(classId), 'Class');
  return repository.list(classId, page.limit, page.offset);
}

async function update(id, body, user) {
  check.fields(body, names);
  if (!Object.keys(body).length) fail(400, 'At least one field is required');
  const item = found(await reservations.findById(id), 'Reservation');
  allowOwner(user, item.user_id, false);
  const old = await get(id);
  const current = { rating: old.rating, comment: old.comment,
    intensity: old.intensity, tags: old.tags };
  return repository.update(id, validate({ ...current, ...body }));
}

async function remove(id, user) {
  const item = found(await reservations.findById(id), 'Reservation');
  allowOwner(user, item.user_id, false);
  await get(id);
  await repository.remove(id);
}

module.exports = { create, get, list, update, remove };
