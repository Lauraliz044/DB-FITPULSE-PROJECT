require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const mysql = require('mysql2/promise');
const { checkSchema } = require('../src/config/schema');

async function main() {
  const name = process.env.TEST_DB_NAME;
  if (!name || !/^[a-zA-Z0-9_]+_test$/.test(name)) {
    throw new Error('TEST_DB_NAME must end with _test');
  }
  const isolated = `${name.slice(0, 28)}_schema_${Date.now()}_test`;
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    multipleStatements: true
  });
  let created = false;
  let assertions = 0;
  const cases = [];
  try {
    await connection.query(`CREATE DATABASE \`${isolated}\``);
    created = true;
    await connection.query(`USE \`${isolated}\``);
    await connection.query(await fs.readFile(path.join(__dirname, '../database/schema.sql'), 'utf8'));
    await checkSchema(connection);
    cases.push('Fresh seven-table schema accepted'); assertions++;
    await connection.query('ALTER TABLE users RENAME COLUMN failed_login_attempts TO legacy_attempts');
    await assert.rejects(checkSchema(connection), /missing column users.failed_login_attempts/);
    cases.push('Missing login column rejected before serving requests'); assertions++;
    await connection.query('ALTER TABLE users RENAME COLUMN legacy_attempts TO failed_login_attempts');
    await connection.query('ALTER TABLE users ADD legacy_required INT NOT NULL');
    await assert.rejects(checkSchema(connection), /extra required column users.legacy_required/);
    cases.push('Extra mandatory legacy column rejected'); assertions++;
    await connection.query('ALTER TABLE users DROP COLUMN legacy_required');
    await connection.query('ALTER TABLE personal_records MODIFY idrecord INT NOT NULL');
    await assert.rejects(checkSchema(connection), /personal_records.idrecord needs AUTO_INCREMENT/);
    cases.push('Missing automatic record identifier rejected'); assertions++;
    await connection.query('ALTER TABLE personal_records MODIFY idrecord INT NOT NULL AUTO_INCREMENT');
    await connection.query('DROP TABLE personal_records');
    await assert.rejects(checkSchema(connection), /missing table personal_records/);
    cases.push('Missing seventh table rejected'); assertions++;
    const result = { passed: true, assertions, cases, executedAt: new Date().toISOString(),
      fixtureNote: 'A newly created isolated test database is removed after this run.' };
    await fs.writeFile(path.join(__dirname, '../evidence/schema-results.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(`Schema compatibility: ${assertions} cases passed`);
  } finally {
    if (created) await connection.query(`DROP DATABASE \`${isolated}\``);
    await connection.end();
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
