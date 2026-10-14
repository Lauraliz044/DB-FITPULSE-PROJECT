const jwt = require('jsonwebtoken');
const repository = require('../repositories/user-repository');
const userService = require('./user-service');
const { transaction } = require('../config/database');
const settings = require('../config/settings');
const { utcDate } = require('../utils/time');
const { fail } = require('../utils/errors');

async function create(body) {
  const data = userService.credentials(body);
  const result = await transaction(async (connection) => {
    const user = await repository.findCredentials(data.email, connection);
    if (!user) return { status: 401, message: 'Invalid credentials' };
    if (user.status !== 'active') return { status: 403, message: 'Account is inactive' };
    const now = new Date();
    if (user.locked_until && utcDate(user.locked_until) > now) {
      return { status: 423, message: 'Account is temporarily locked' };
    }
    if (user.password !== data.password) {
      const oldAttempts = user.locked_until ? 0 : user.failed_login_attempts;
      const attempts = oldAttempts + 1;
      const locked = attempts >= settings.maxLoginAttempts;
      const lockedUntil = locked
        ? new Date(now.getTime() + settings.lockMinutes * 60000)
          .toISOString().slice(0, 19).replace('T', ' ')
        : null;
      await repository.updateAttempts(user.id, attempts, lockedUntil, connection);
      return {
        status: locked ? 423 : 401,
        message: locked ? 'Account is temporarily locked' : 'Invalid credentials'
      };
    }
    await repository.updateAttempts(user.id, 0, null, connection);
    return { id: user.id };
  });
  if (result.status) fail(result.status, result.message);
  const user = await repository.findById(result.id);
  const accessToken = jwt.sign({}, settings.jwtSecret, {
    subject: String(user.id), expiresIn: settings.jwtExpiresIn, algorithm: 'HS256'
  });
  return { accessToken, tokenType: 'Bearer', expiresIn: settings.jwtExpiresIn, user };
}

module.exports = { create };
