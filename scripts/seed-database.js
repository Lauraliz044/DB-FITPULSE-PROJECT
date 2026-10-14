const { pool, query, transaction } = require('../src/config/database');

async function seed() {
  try {
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
      throw new Error('Valid ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD are required');
    }
    await transaction(async (connection) => {
      await query(`INSERT INTO users (name, email, password, role)
        SELECT ?, ?, ?, 'admin' WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = ?)`,
        [ADMIN_NAME, ADMIN_EMAIL.toLowerCase(), ADMIN_PASSWORD, ADMIN_EMAIL.toLowerCase()],
        connection);
      const existing = await query('SELECT COUNT(*) AS total FROM packages', [], connection);
      if (Number(existing[0].total) === 0) {
        await query(`INSERT INTO packages (name, class_quantity, price, description)
          VALUES (?, ?, ?, ?), (?, ?, ?, ?)`,
          ['Starter', 5, '120000.00', 'Five scheduled classes',
            'Regular', 10, '220000.00', 'Ten scheduled classes'], connection);
      }
    });
    console.log('Demo administrator and package catalog are ready');
  } catch (error) {
    console.error(`Database seed failed: ${error.code || error.message}`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seed();
