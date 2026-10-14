const { query } = require('../config/database');

const publicColumns = `idusers AS id, name, email, role, status, registered_at`;

async function create(userData) {
  const result = await query(`INSERT INTO users (name, email, password) VALUES (?, ?, ?)`,
    [userData.name, userData.email, userData.password]);
  return findById(result.insertId);
}

async function findById(userId) {
  const rows = await query(`SELECT ${publicColumns} FROM users WHERE idusers = ?`, [userId]);
  return rows[0];
}

async function list(limit, offset) {
  return query(`SELECT ${publicColumns} FROM users ORDER BY idusers LIMIT ? OFFSET ?`,
    [String(limit), String(offset)]);
}

async function updateStatus(userId, status) {
  await query('UPDATE users SET status = ? WHERE idusers = ?', [status, userId]);
  return findById(userId);
}

async function findCredentials(email, connection) {
  const rows = await query(`SELECT ${publicColumns}, password, failed_login_attempts, locked_until
    FROM users WHERE email = ? FOR UPDATE`, [email], connection);
  return rows[0];
}

async function updateAttempts(userId, attempts, lockedUntil, connection) {
  await query(`UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE idusers = ?`,
    [attempts, lockedUntil, userId], connection);
}

module.exports = { create, findById, list, updateStatus, findCredentials, updateAttempts };
