const jwt = require('jsonwebtoken');
const settings = require('../config/settings');
const repository = require('../repositories/user-repository');
const asyncHandler = require('./async-handler');
const { fail } = require('../utils/errors');

const authenticate = asyncHandler(async (request, response, next) => {
  const header = request.get('Authorization') || '';
  if (!header.startsWith('Bearer ')) fail(401, 'A Bearer token is required');
  let payload;
  try {
    payload = jwt.verify(header.slice(7), settings.jwtSecret, { algorithms: ['HS256'] });
  } catch (error) {
    if (['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name)) {
      fail(401, 'Invalid or expired token');
    }
    throw error;
  }
  const user = await repository.findById(Number(payload.sub));
  if (!user) fail(401, 'Invalid session');
  if (user.status !== 'active') fail(403, 'Account is inactive');
  request.user = user;
  next();
});

function requireAdmin(request, response, next) {
  if (request.user.role !== 'admin') fail(403, 'Administrator access is required');
  next();
}

function requireClient(request, response, next) {
  if (request.user.role !== 'client') fail(403, 'Client access is required');
  next();
}

module.exports = { authenticate, requireAdmin, requireClient };
