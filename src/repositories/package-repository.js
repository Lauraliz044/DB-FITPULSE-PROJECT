const { query } = require('../config/database');

async function list(limit, offset) {
  return query('SELECT * FROM packages ORDER BY id LIMIT ? OFFSET ?',
    [String(limit), String(offset)]);
}

async function findById(id, connection, lock = false) {
  const rows = await query(`SELECT * FROM packages WHERE id = ? ${lock ? 'FOR UPDATE' : ''}`,
    [id], connection);
  return rows[0];
}

async function create(data) {
  const result = await query(`INSERT INTO packages (name, class_quantity, price, description)
    VALUES (?, ?, ?, ?)`, [data.name, data.classQuantity, data.price, data.description]);
  return findById(result.insertId);
}

async function update(id, data, connection) {
  await query('UPDATE packages SET name = ?, class_quantity = ?, price = ?, description = ? WHERE id = ?',
    [data.name, data.classQuantity, data.price, data.description, id], connection);
  return findById(id, connection);
}

async function purchaseCount(id, connection) {
  const rows = await query('SELECT COUNT(*) AS total FROM purchases WHERE package_id = ?',
    [id], connection);
  return Number(rows[0].total);
}

async function remove(id, connection) {
  await query('DELETE FROM packages WHERE id = ?', [id], connection);
}

module.exports = { list, findById, create, update, remove, purchaseCount };
