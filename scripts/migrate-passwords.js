const { pool } = require('../src/config/database');
const { checkSchema } = require('../src/config/schema');
const { migratePasswords } = require('../src/services/password-migration-service');

async function migrate() {
  try {
    await checkSchema(pool);
    const result = await migratePasswords();
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(`Password migration failed: ${error.code || error.name}`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
