const repository = require('../repositories/purchase-repository');
const packages = require('../repositories/package-repository');
const users = require('../repositories/user-repository');
const { transaction } = require('../config/database');
const check = require('../utils/validation');
const { found, allowOwner } = require('../utils/errors');

async function create(body, user) {
  check.fields(body, ['packageId'], ['packageId']);
  const packageId = check.integer(body.packageId, 'packageId');
  return transaction(async (connection) => {
    const item = found(await packages.findById(packageId, connection, true), 'Package');
    return repository.create(user.id, packageId, item.price, connection);
  });
}

async function get(id, user) {
  const item = found(await repository.findById(id), 'Purchase');
  allowOwner(user, item.user_id);
  return item;
}

async function list(query, userId, user) {
  const page = check.pagination(query);
  if (userId) {
    allowOwner(user, userId);
    found(await users.findById(userId), 'User');
  }
  return repository.list(userId, page.limit, page.offset);
}

module.exports = { create, get, list };
