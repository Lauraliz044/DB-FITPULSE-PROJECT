const { pool, query, transaction } = require('../src/config/database');
const { checkSchema } = require('../src/config/schema');
const { hashPassword } = require('../src/utils/passwords');
const { credentials } = require('../src/services/user-service');

async function seed() {
  try {
    await checkSchema(pool);
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
    if (!ADMIN_NAME || ADMIN_NAME.length > 45 || !ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
      throw new Error('Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in .env');
    }
    const administrator = credentials({ name: ADMIN_NAME, email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD }, true);
    await transaction(async (connection) => {
      const email = administrator.email;
      const users = await query('SELECT role, status FROM users WHERE email = ? FOR UPDATE', [email], connection);
      if (users.length === 0) {
        const passwordHash = await hashPassword(administrator.password);
        await query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
          [administrator.name, email, passwordHash, 'admin'], connection);
      } else if (users[0].role !== 'admin' || users[0].status !== 'active') {
        throw new Error('ADMIN_EMAIL already belongs to a different role or inactive account');
      }
      const packages = await query('SELECT COUNT(*) AS total FROM packages', [], connection);
      if (Number(packages[0].total) === 0) {
        await query(`INSERT INTO packages (name, class_quantity, price, description)
          VALUES (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?)`,
          ['Pase Diario', 1, '10000.00', 'Una clase grupal a elección.',
            'Paquete Mensual', 4, '35000.00', 'Cuatro clases grupales con seguimiento en la app.',
            'Paquete Anual', 45, '300000.00', 'Cuarenta y cinco clases grupales para todo el año.'],
          connection);
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
