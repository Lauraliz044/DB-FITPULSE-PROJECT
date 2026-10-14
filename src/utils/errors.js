function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function found(value, resource) {
  if (!value) fail(404, `${resource} not found`);
  return value;
}

function allowOwner(user, ownerId, allowAdmin = true) {
  if (user.id !== ownerId && !(allowAdmin && user.role === 'admin')) {
    fail(403, 'Access denied');
  }
}

module.exports = { fail, found, allowOwner };
