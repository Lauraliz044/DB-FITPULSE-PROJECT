const repository = require('../repositories/record-repository');
const users = require('../repositories/user-repository');
const check = require('../utils/validation');
const { fail, found, allowOwner } = require('../utils/errors');
const { businessDate } = require('../utils/time');

const names = ['exercise', 'recordType', 'value', 'unit', 'achievedOn'];

function validate(body) {
  check.fields(body, names, names);
  const achievedOn = check.date(body.achievedOn, 'achievedOn');
  if (achievedOn > businessDate()) fail(400, 'achievedOn cannot be in the future');
  return {
    exercise: check.text(body.exercise, 'exercise', 100),
    recordType: check.text(body.recordType, 'recordType', 50),
    value: check.decimal(body.value, 'value', 999999999.999, 3, 0.001),
    unit: check.text(body.unit, 'unit', 20), achievedOn
  };
}

async function list(userId, query, user) {
  allowOwner(user, userId);
  const page = check.pagination(query);
  found(await users.findById(userId), 'User');
  return repository.list(userId, page.limit, page.offset);
}

async function create(userId, body, user) {
  allowOwner(user, userId, false);
  return repository.create(userId, validate(body));
}

async function get(id, user) {
  const item = found(await repository.findById(id), 'Personal record');
  allowOwner(user, item.user_id);
  return item;
}

async function update(id, body, user) {
  check.fields(body, names);
  if (!Object.keys(body).length) fail(400, 'At least one field is required');
  const item = await get(id, user);
  allowOwner(user, item.user_id, false);
  const current = {
    exercise: item.exercise, recordType: item.record_type, value: Number(item.value),
    unit: item.unit, achievedOn: item.achieved_on
  };
  return repository.update(id, validate({ ...current, ...body }));
}

async function remove(id, user) {
  const item = await get(id, user);
  allowOwner(user, item.user_id, false);
  await repository.remove(id);
}

module.exports = { list, create, get, update, remove };
