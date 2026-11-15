require('dotenv').config({ quiet: true });
process.env.DB_NAME = process.env.TEST_DB_NAME;
if (!process.env.DB_NAME || !process.env.DB_NAME.endsWith('_test')) {
  throw new Error('TEST_DB_NAME must end with _test');
}

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { pool, query } = require('../src/config/database');
const repository = require('../src/repositories/user-repository');
const { verifyPassword, isPasswordHash } = require('../src/utils/passwords');
const { migratePasswords } = require('../src/services/password-migration-service');

const cases = [];

function runTool(filename) {
  const result = spawnSync(process.execPath, [path.join(__dirname, '../scripts', filename)], {
    env: process.env, encoding: 'utf8'
  });
  assert.equal(result.status, 0, `Credential tool failed: ${filename}`);
  return result.stdout.trim();
}

async function getCredentials(email) {
  const users = await query('SELECT idusers AS id, password, role FROM users WHERE email = ?',
    [email.trim().toLowerCase()]);
  assert.equal(users.length, 1);
  return users[0];
}

async function verifySeed(filename, email, password, expectedRole) {
  runTool(filename);
  const firstUser = await getCredentials(email);
  assert.equal(firstUser.role, expectedRole);
  assert.ok(isPasswordHash(firstUser.password));
  assert.ok(await verifyPassword(password, firstUser.password));
  cases.push({ label: `${filename}: new credentials are hashed`, passed: true });
  runTool(filename);
  assert.deepEqual(await getCredentials(email), firstUser);
  cases.push({ label: `${filename}: repeated execution preserves the account`, passed: true });
}

async function createLegacyUsers() {
  const password = randomBytes(24).toString('base64url');
  const userIds = [];
  for (let index = 0; index < 2; index += 1) {
    const email = `${randomBytes(12).toString('hex')}@fitpulse.example`;
    const result = await query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      ['Migration Fixture', email, password]);
    userIds.push(result.insertId);
  }
  return { password, userIds };
}

async function verifyRollback(fixture) {
  const originalUpdate = repository.updatePassword;
  repository.updatePassword = async (userId, passwordHash, connection) => {
    if (userId === fixture.userIds[1]) throw new Error('Migration failure fixture');
    return originalUpdate(userId, passwordHash, connection);
  };
  try {
    await assert.rejects(migratePasswords(), /Migration failure fixture/);
  } finally {
    repository.updatePassword = originalUpdate;
  }
  for (const userId of fixture.userIds) {
    const [user] = await query('SELECT password FROM users WHERE idusers = ?', [userId]);
    assert.equal(user.password, fixture.password);
  }
  cases.push({ label: 'A failed migration rolls back all preceding credential updates', passed: true });
}

async function verifyMigrationCommand(fixture) {
  const summary = JSON.parse(runTool('migrate-passwords.js'));
  assert.ok(summary.migrated >= fixture.userIds.length);
  const hashes = [];
  for (const userId of fixture.userIds) {
    const [user] = await query('SELECT password FROM users WHERE idusers = ?', [userId]);
    assert.ok(isPasswordHash(user.password));
    assert.ok(await verifyPassword(fixture.password, user.password));
    hashes.push(user.password);
  }
  assert.notEqual(hashes[0].split('$')[4], hashes[1].split('$')[4]);
  cases.push({ label: 'The migration command preserves passwords and generates independent salts', passed: true });
  assert.equal(JSON.parse(runTool('migrate-passwords.js')).migrated, 0);
  for (const [index, userId] of fixture.userIds.entries()) {
    const [user] = await query('SELECT password FROM users WHERE idusers = ?', [userId]);
    assert.equal(user.password, hashes[index]);
  }
  cases.push({ label: 'Repeated command execution leaves migrated hashes unchanged', passed: true });
}

async function main() {
  let fixture;
  const summary = { passed: false, executedAt: new Date().toISOString() };
  try {
    await verifySeed('seed-database.js', process.env.ADMIN_EMAIL,
      process.env.ADMIN_PASSWORD, 'admin');
    await verifySeed('seed-demo.js', process.env.DEMO_CLIENT_EMAIL,
      process.env.DEMO_CLIENT_PASSWORD, 'client');
    fixture = await createLegacyUsers();
    await verifyRollback(fixture);
    await verifyMigrationCommand(fixture);
    summary.passed = true;
    console.log(`Credential tools: ${cases.length} cases passed`);
  } catch (error) {
    console.error(`Credential verification failed: ${error.code || error.name}`);
    process.exitCode = 1;
  } finally {
    if (fixture) {
      for (const userId of fixture.userIds) {
        await query('DELETE FROM users WHERE idusers = ?', [userId]);
      }
    }
    await fs.mkdir(path.join(__dirname, '../evidence'), { recursive: true });
    await fs.writeFile(path.join(__dirname, '../evidence/credential-tools-results.json'),
      JSON.stringify({ summary, cases }, null, 2) + '\n');
    await pool.end();
  }
}

main();
