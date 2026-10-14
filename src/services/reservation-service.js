const repository = require('../repositories/reservation-repository');
const classes = require('../repositories/class-repository');
const users = require('../repositories/user-repository');
const { transaction } = require('../config/database');
const check = require('../utils/validation');
const { fail, found, allowOwner } = require('../utils/errors');
const { utcDate } = require('../utils/time');

async function create(body, user) {
  check.fields(body, ['classId'], ['classId']);
  const classId = check.integer(body.classId, 'classId');
  return transaction(async (connection) => {
    const item = found(await classes.findById(classId, connection, true), 'Class');
    if (utcDate(item.starts_at) <= new Date()) fail(409, 'The class has already started');
    if (await repository.findByUserClass(user.id, classId, connection)) {
      fail(409, 'The class is already reserved by this user');
    }
    const total = await classes.reservationCount(classId, connection);
    if (total >= item.capacity) fail(409, 'The class is full');
    return repository.create(user.id, classId, connection);
  });
}

async function get(id, user) {
  const item = found(await repository.findById(id), 'Reservation');
  allowOwner(user, item.user_id);
  return item;
}

async function list(userId, query, user) {
  allowOwner(user, userId);
  const page = check.pagination(query, ['status']);
  const status = query.status === undefined ? undefined :
    check.choice(query.status, 'status', ['reserved', 'attended', 'no_show']);
  found(await users.findById(userId), 'User');
  return repository.list(userId, status, page.limit, page.offset);
}

async function attendance(id, body) {
  check.fields(body, ['status'], ['status']);
  const status = check.choice(body.status, 'status', ['attended', 'no_show']);
  return transaction(async (connection) => {
    const item = found(await repository.findById(id, connection, true), 'Reservation');
    if (utcDate(item.ends_at) > new Date()) fail(409, 'The class has not ended');
    if (item.status !== 'reserved' && item.status !== status) {
      fail(409, 'Attendance has already been recorded');
    }
    return repository.attendance(id, status, connection);
  });
}

module.exports = { create, get, list, attendance };
