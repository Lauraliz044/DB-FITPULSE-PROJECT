const repository = require('../repositories/user-repository');
const check = require('../utils/validation');
const { fail, found, allowOwner } = require('../utils/errors');

function credentials(body, registration = false) {
  const allowed = registration ? ['name', 'email', 'password'] : ['email', 'password'];
  check.fields(body, allowed, allowed);
  const email = check.text(body.email, 'email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, 'Invalid email');
  if (typeof body.password !== 'string' || body.password.length < 8 ||
      body.password.length > 200) {
    fail(400, 'password must contain between 8 and 200 characters');
  }
  const data = { email, password: body.password };
  if (registration) data.name = check.text(body.name, 'name', 45);
  return data;
}

async function register(body) {
  return repository.create(credentials(body, true));
}

async function get(id, user) {
  allowOwner(user, id);
  return found(await repository.findById(id), 'User');
}

async function list(query) {
  const page = check.pagination(query);
  return repository.list(page.limit, page.offset);
}

async function updateStatus(id, body) {
  check.fields(body, ['status'], ['status']);
  const status = check.choice(body.status, 'status', ['active', 'inactive']);
  found(await repository.findById(id), 'User');
  return repository.updateStatus(id, status);
}

module.exports = { credentials, register, get, list, updateStatus };
