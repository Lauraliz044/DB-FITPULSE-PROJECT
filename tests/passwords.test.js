const test = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { hashPassword, verifyPassword, isPasswordHash } = require('../src/utils/passwords');

test('equal passwords receive independent salts and verify correctly', async () => {
  const password = randomBytes(24).toString('base64url');
  const firstHash = await hashPassword(password);
  const secondHash = await hashPassword(password);
  assert.notEqual(firstHash, secondHash);
  assert.notEqual(firstHash.split('$')[4], secondHash.split('$')[4]);
  assert.equal(Buffer.from(firstHash.split('$')[4], 'base64').length, 16);
  assert.ok(isPasswordHash(firstHash));
  assert.ok(await verifyPassword(password, firstHash));
  assert.equal(await verifyPassword(`${password}wrong`, firstHash), false);
});

test('the complete Unicode password is verified without truncating its suffix', async () => {
  const prefix = '\u00e1'.repeat(199);
  const passwordHash = await hashPassword(`${prefix}a`);
  assert.ok(await verifyPassword(`${prefix}a`, passwordHash));
  assert.equal(await verifyPassword(`${prefix}b`, passwordHash), false);
});

test('plain text and incomplete hashes cannot be used as stored credentials', async () => {
  const password = randomBytes(24).toString('base64url');
  assert.equal(await verifyPassword(password, password), false);
  assert.equal(await verifyPassword(password, '$argon2id$incomplete'), false);
  assert.equal(await verifyPassword(password, null), false);
});

test('sending the stored hash itself does not authenticate a user', async () => {
  const passwordHash = await hashPassword(randomBytes(24).toString('base64url'));
  assert.equal(await verifyPassword(passwordHash, passwordHash), false);
});
