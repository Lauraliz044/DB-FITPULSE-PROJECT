const { query } = require('../config/database');

const publicColumns = 'id, name, email, role, status, registered_at';

async function create(data) {
  const result = await query(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
    [data.name, data.email, data.password]
  );
  return findById(result.insertId);
}

async function findById(id) {
  const rows = await query(`SELECT ${publicColumns} FROM users WHERE id = ?`, [id]);
  return rows[0];
}

async function list(limit, offset) {
  return query(`SELECT ${publicColumns} FROM users ORDER BY id LIMIT ? OFFSET ?`,
    [String(limit), String(offset)]);
}

async function updateStatus(id, status) {
  await query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
  return findById(id);
}

async function findCredentials(email, connection) {
  const rows = await query('SELECT * FROM users WHERE email = ? FOR UPDATE',
    [email], connection);
  return rows[0];
}

async function updateAttempts(id, attempts, lockedUntil, connection) {
  await query('UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?',
    [attempts, lockedUntil, id], connection);
}

module.exports = {
  create, findById, list, updateStatus, findCredentials, updateAttempts
};
