const requiredTables = ['users', 'scheduled_classes', 'packages', 'purchases',
  'reservations', 'reviews', 'personal_records'];

async function checkSchema(connection) {
  const [rows] = await connection.query(
    'SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()'
  );
  const existingTables = rows.map((row) => row.name);
  const missingTables = requiredTables.filter((name) => !existingTables.includes(name));
  if (missingTables.length) {
    throw new Error(`Missing tables: ${missingTables.join(', ')}. Run npm run db:setup`);
  }
}

module.exports = { checkSchema };
