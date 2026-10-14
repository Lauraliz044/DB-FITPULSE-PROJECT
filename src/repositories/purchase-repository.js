const { query } = require('../config/database');

const details = `SELECT p.*, u.name AS buyer_name, u.email AS buyer_email,
  k.name AS package_name, k.class_quantity FROM purchases p
  JOIN users u ON u.id = p.user_id JOIN packages k ON k.id = p.package_id`;

async function create(userId, packageId, price, connection) {
  const result = await query(`INSERT INTO purchases (user_id, package_id, paid_price)
    VALUES (?, ?, ?)`, [userId, packageId, price], connection);
  return findById(result.insertId, connection);
}

async function findById(id, connection) {
  const rows = await query(`${details} WHERE p.id = ?`, [id], connection);
  return rows[0];
}

async function list(userId, limit, offset) {
  const where = userId ? ' WHERE p.user_id = ?' : '';
  const parameters = userId ? [userId] : [];
  parameters.push(String(limit), String(offset));
  return query(`${details}${where} ORDER BY p.id DESC LIMIT ? OFFSET ?`, parameters);
}

async function sales() {
  return query('SELECT package_id, purchased_at, paid_price FROM purchases ORDER BY id');
}

module.exports = { create, findById, list, sales };
