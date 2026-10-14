const { query } = require('../config/database');

const details = `SELECT r.*, c.name AS class_name, c.category, c.starts_at,
  c.ends_at FROM reservations r JOIN classes c ON c.id = r.class_id`;

async function findById(id, connection, lock = false) {
  const rows = await query(`${details} WHERE r.id = ? ${lock ? 'FOR UPDATE' : ''}`,
    [id], connection);
  return rows[0];
}

async function findByUserClass(userId, classId, connection) {
  const rows = await query('SELECT id FROM reservations WHERE user_id = ? AND class_id = ?',
    [userId, classId], connection);
  return rows[0];
}

async function create(userId, classId, connection) {
  const result = await query('INSERT INTO reservations (user_id, class_id) VALUES (?, ?)',
    [userId, classId], connection);
  return findById(result.insertId, connection);
}

async function list(userId, status, limit, offset) {
  const parameters = [userId];
  const filter = status ? ' AND r.status = ?' : '';
  if (status) parameters.push(status);
  parameters.push(String(limit), String(offset));
  return query(`${details} WHERE r.user_id = ?${filter}
    ORDER BY c.starts_at DESC, r.id DESC LIMIT ? OFFSET ?`, parameters);
}

async function attendance(id, status, attendedAt, connection) {
  await query('UPDATE reservations SET status = ?, attended_at = ? WHERE id = ?',
    [status, attendedAt, id], connection);
  return findById(id, connection);
}

async function attended(userId) {
  return query(`${details} WHERE r.user_id = ? AND r.status = 'attended'`, [userId]);
}

module.exports = { findById, findByUserClass, create, list, attendance, attended };
