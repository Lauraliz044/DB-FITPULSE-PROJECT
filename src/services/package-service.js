const repository = require('../repositories/package-repository');
const { transaction } = require('../config/database');
const check = require('../utils/validation');
const { fail, found } = require('../utils/errors');

const names = ['name', 'classQuantity', 'price', 'description'];

function validate(body) {
  check.fields(body, names, names);
  return {
    name: check.text(body.name, 'name', 100),
    classQuantity: check.integer(body.classQuantity, 'classQuantity'),
    price: check.decimal(body.price, 'price', 99999999.99, 2),
    description: check.text(body.description, 'description', 5000)
  };
}

async function list(query) {
  const page = check.pagination(query);
  return repository.list(page.limit, page.offset);
}

async function get(id) {
  return found(await repository.findById(id), 'Package');
}

async function create(body) {
  return repository.create(validate(body));
}

async function update(id, body) {
  check.fields(body, names);
  if (!Object.keys(body).length) fail(400, 'At least one field is required');
  return transaction(async (connection) => {
    const old = found(await repository.findById(id, connection, true), 'Package');
    if (await repository.purchaseCount(id, connection)) {
      fail(409, 'A purchased package cannot be changed');
    }
    const current = {
      name: old.name, classQuantity: old.class_quantity,
      price: Number(old.price), description: old.description
    };
    return repository.update(id, validate({ ...current, ...body }), connection);
  });
}

async function remove(id) {
  await transaction(async (connection) => {
    found(await repository.findById(id, connection, true), 'Package');
    if (await repository.purchaseCount(id, connection)) {
      fail(409, 'A purchased package cannot be deleted');
    }
    await repository.remove(id, connection);
  });
}

module.exports = { list, get, create, update, remove };
