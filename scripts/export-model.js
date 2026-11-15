const fs = require('node:fs/promises');
const path = require('node:path');
const { pool, query } = require('../src/config/database');
const { checkSchema } = require('../src/config/schema');

async function exportModel() {
  try {
    await checkSchema(pool);
    const columns = await query(`SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName,
      COLUMN_TYPE AS columnType, IS_NULLABLE AS nullable, COLUMN_DEFAULT AS defaultValue,
      COLUMN_KEY AS columnKey, EXTRA AS extra FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME, ORDINAL_POSITION`);
    const foreignKeys = await query(`SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName,
      CONSTRAINT_NAME AS constraintName, REFERENCED_TABLE_NAME AS referencedTable,
      REFERENCED_COLUMN_NAME AS referencedColumn FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY TABLE_NAME, CONSTRAINT_NAME`);
    const version = (await query('SELECT VERSION() AS version'))[0].version;
    const tables = [...new Set(columns.map((column) => column.tableName))];
    const result = { source: 'Live MySQL information_schema after database/schema.sql',
      executedAt: new Date().toISOString(), mysqlVersion: version, tables, columns, foreignKeys };
    await fs.mkdir(path.join(__dirname, '../evidence'), { recursive: true });
    await fs.writeFile(path.join(__dirname, '../evidence/model-metadata.json'),
      JSON.stringify(result, null, 2) + '\n');
    console.log(`Model exported: ${tables.length} tables, ${columns.length} columns, ${foreignKeys.length} foreign keys`);
  } finally {
    await pool.end();
  }
}

exportModel().catch((error) => { console.error(error.message); process.exitCode = 1; });
