const repository = require('../repositories/class-repository');
const { transaction } = require('../config/database');
const check = require('../utils/validation');
const { fail, found } = require('../utils/errors');
const { utcDate } = require('../utils/time');

const names = ['name', 'category', 'instructorName', 'startsAt', 'endsAt',
  'capacity', 'price', 'description'];

function validate(body) {
  check.fields(body, names, names);
  const startsAt = check.timestamp(body.startsAt, 'startsAt');
  const endsAt = check.timestamp(body.endsAt, 'endsAt');
  if (utcDate(startsAt) <= new Date()) fail(400, 'startsAt must be in the future');
  if (endsAt <= startsAt) fail(400, 'endsAt must be after startsAt');
  return {
    name: check.text(body.name, 'name', 100),
    category: check.text(body.category, 'category', 50).toLowerCase(),
    instructorName: check.text(body.instructorName, 'instructorName', 100),
    startsAt, endsAt,
    capacity: check.integer(body.capacity, 'capacity'),
    price: check.decimal(body.price, 'price', 99999999.99, 2),
    description: check.text(body.description, 'description', 5000)
  };
}

async function list(query) {
  const page = check.pagination(query);
  return repository.list(page.limit, page.offset);
}

async function get(id) {
  return found(await repository.findById(id), 'Class');
}

async function create(body) {
  return repository.create(validate(body));
}

async function update(id, body) {
  check.fields(body, names);
  if (!Object.keys(body).length) fail(400, 'At least one field is required');
  return transaction(async (connection) => {
    const old = found(await repository.findById(id, connection, true), 'Class');
    if (await repository.reservationCount(id, connection)) {
      fail(409, 'A class with reservations cannot be changed');
    }
    const current = {
      name: old.name, category: old.category, instructorName: old.instructor_name,
      startsAt: `${old.starts_at.replace(' ', 'T')}Z`,
      endsAt: `${old.ends_at.replace(' ', 'T')}Z`, capacity: old.capacity,
      price: Number(old.price), description: old.description
    };
    return repository.update(id, validate({ ...current, ...body }), connection);
  });
}

async function remove(id) {
  await transaction(async (connection) => {
    const item = found(await repository.findById(id, connection, true), 'Class');
    if (utcDate(item.starts_at) <= new Date() ||
        await repository.reservationCount(id, connection)) {
      fail(409, 'Only future classes without reservations can be deleted');
    }
    await repository.remove(id, connection);
  });
}

module.exports = { list, get, create, update, remove };
