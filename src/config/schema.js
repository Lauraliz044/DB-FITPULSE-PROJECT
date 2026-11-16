const requiredColumns = {
  users: ['idusers', 'name', 'email', 'password', 'role', 'status', 'registered_at',
    'failed_login_attempts', 'locked_until'],
  scheduled_classes: ['idscheduled_classes', 'name', 'instructor_name', 'category',
    'price', 'capacity', 'starts_at', 'ends_at', 'description'],
  packages: ['idpackages', 'name', 'price', 'class_quantity', 'description'],
  purchases: ['idpurchase', 'paid_price', 'purchased_at', 'idusers', 'idpackages'],
  reservations: ['idreservation', 'user_id', 'class_id', 'created_at', 'status'],
  reviews: ['idreview', 'rating', 'comment', 'tags', 'created_at', 'updated_at',
    'iduser', 'idclass', 'intensity'],
  personal_records: ['idrecord', 'user_id', 'exercise', 'record_type', 'value',
    'unit', 'achieved_on']
};

async function checkSchema(connection) {
  const [rows] = await connection.query(`SELECT TABLE_NAME AS tableName,
    COLUMN_NAME AS columnName, IS_NULLABLE AS nullable, COLUMN_DEFAULT AS defaultValue,
    EXTRA AS extra FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()`);
  const problems = [];
  for (const [table, columns] of Object.entries(requiredColumns)) {
    const existing = rows.filter((row) => row.tableName === table);
    if (!existing.length) {
      problems.push(`missing table ${table}`);
      continue;
    }
    for (const name of columns) {
      if (!existing.some((row) => row.columnName === name)) {
        problems.push(`missing column ${table}.${name}`);
      }
    }
    const identifier = existing.find((row) => row.columnName === columns[0]);
    if (identifier && !identifier.extra.includes('auto_increment')) {
      problems.push(`${table}.${columns[0]} needs AUTO_INCREMENT`);
    }
    for (const column of existing) {
      if (!columns.includes(column.columnName) && column.nullable === 'NO' &&
          column.defaultValue === null && !/auto_increment|GENERATED/i.test(column.extra)) {
        problems.push(`extra required column ${table}.${column.columnName} has no default`);
      }
    }
  }
  if (problems.length) {
    throw new Error(`Incompatible schema: ${problems.join('; ')}. ` +
      'Compare the existing database with database/schema.sql; existing tables are not changed automatically.');
  }
}

module.exports = { checkSchema };
