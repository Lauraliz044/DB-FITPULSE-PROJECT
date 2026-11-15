const argon2 = require('argon2');
const policy = require('../config/password-policy');

const hashPattern = /^\$argon2id\$v=19\$m=\d+,t=\d+,p=\d+\$[A-Za-z0-9+/]+\$[A-Za-z0-9+/]+$/;

function isPasswordHash(value) {
  return typeof value === 'string' && hashPattern.test(value);
}

async function hashPassword(password) {
  return argon2.hash(password, policy);
}

async function verifyPassword(password, storedHash) {
  if (!isPasswordHash(storedHash)) return false;
  return argon2.verify(storedHash, password);
}

module.exports = { hashPassword, verifyPassword, isPasswordHash };
