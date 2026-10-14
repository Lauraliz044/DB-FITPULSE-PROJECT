const { pool, query, transaction } = require('../src/config/database');
const { checkSchema } = require('../src/config/schema');

async function seed() {
  try {
    await checkSchema(pool);
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
    if (!ADMIN_NAME || ADMIN_NAME.length > 45 || !ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
      throw new Error('Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in .env');
    }
    await transaction(async (connection) => {
      const email = ADMIN_EMAIL.trim().toLowerCase();
      const users = await query('SELECT role, status FROM users WHERE email = ? FOR UPDATE', [email], connection);
      if (users.length === 0) {
        await query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
          [ADMIN_NAME.trim(), email, ADMIN_PASSWORD, 'admin'], connection);
      } else if (users[0].role !== 'admin' || users[0].status !== 'active') {
        throw new Error('ADMIN_EMAIL already belongs to a different role or inactive account');
      }
      const packages = await query('SELECT COUNT(*) AS total FROM packages', [], connection);
      if (Number(packages[0].total) === 0) {
        await query(`INSERT INTO packages (name, class_quantity, price, description)
          VALUES (?, ?, ?, ?), (?, ?, ?, ?)`,
          ['Starter', 5, '120000.00', 'Five gym classes', 'Regular', 10, '220000.00', 'Ten gym classes'], connection);
      }
    });
    console.log('Administrator and package examples are ready');
  } catch (error) {
    console.error(`Database seed failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seed();
