const { pool, query, transaction } = require('../src/config/database');
const { checkSchema } = require('../src/config/schema');

async function findDemoClient(email, connection) {
  const users = await query('SELECT idusers AS id, role FROM users WHERE email = ? FOR UPDATE',
    [email], connection);
  return users[0];
}

async function seedDemo() {
  try {
    await checkSchema(pool);
    const { DEMO_CLIENT_NAME, DEMO_CLIENT_EMAIL, DEMO_CLIENT_PASSWORD } = process.env;
    if (!DEMO_CLIENT_NAME || DEMO_CLIENT_NAME.length > 45 || !DEMO_CLIENT_EMAIL ||
        !DEMO_CLIENT_PASSWORD || DEMO_CLIENT_PASSWORD.length < 8) {
      throw new Error('Set DEMO_CLIENT_NAME, DEMO_CLIENT_EMAIL and DEMO_CLIENT_PASSWORD in .env');
    }
    await transaction(async (connection) => {
      const email = DEMO_CLIENT_EMAIL.trim().toLowerCase();
      let client = await findDemoClient(email, connection);
      if (!client) {
        await query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
          [DEMO_CLIENT_NAME.trim(), email, DEMO_CLIENT_PASSWORD], connection);
        client = await findDemoClient(email, connection);
      }
      if (client.role !== 'client') {
        throw new Error('DEMO_CLIENT_EMAIL already belongs to an administrator');
      }
      const finished = await query(`SELECT COUNT(*) AS total FROM reservations reservation
        JOIN scheduled_classes scheduled_class
          ON scheduled_class.idscheduled_classes = reservation.class_id
        WHERE reservation.user_id = ? AND scheduled_class.ends_at < UTC_TIMESTAMP()`,
        [client.id], connection);
      if (Number(finished[0].total) === 0) {
        const pastClass = await query(`INSERT INTO scheduled_classes
          (name, category, instructor_name, starts_at, ends_at, capacity, price, description)
          VALUES (?, ?, ?, DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY),
            DATE_SUB(UTC_TIMESTAMP(), INTERVAL 167 HOUR), ?, ?, ?)`,
          ['Past Yoga', 'yoga', 'Demo Coach', 20, '25000.00', 'Finished demo class'], connection);
        await query('INSERT INTO reservations (user_id, class_id) VALUES (?, ?)',
          [client.id, pastClass.insertId], connection);
      }
    });
    console.log('Demo client and a finished class reservation are ready');
  } catch (error) {
    console.error(`Demo seed failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seedDemo();
