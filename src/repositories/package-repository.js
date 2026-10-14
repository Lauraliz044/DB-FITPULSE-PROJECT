const { query } = require('../config/database');

const columns = 'idpackages AS id, name, class_quantity, price, description';

async function list(limit, offset) {
  return query(`SELECT ${columns} FROM packages ORDER BY idpackages LIMIT ? OFFSET ?`,
    [String(limit), String(offset)]);
}

async function findById(packageId, connection, lock = false) {
  let sql = `SELECT ${columns} FROM packages WHERE idpackages = ?`;
  if (lock) sql += ' FOR UPDATE';
  const rows = await query(sql, [packageId], connection);
  return rows[0];
}

async function create(packageData) {
  const result = await query(`INSERT INTO packages (name, class_quantity, price, description)
    VALUES (?, ?, ?, ?)`, [packageData.name, packageData.classQuantity,
    packageData.price, packageData.description]);
  return findById(result.insertId);
}

async function update(packageId, packageData, connection) {
  await query(`UPDATE packages SET name = ?, class_quantity = ?, price = ?, description = ?
    WHERE idpackages = ?`, [packageData.name, packageData.classQuantity,
    packageData.price, packageData.description, packageId], connection);
  return findById(packageId, connection);
}

async function purchaseCount(packageId, connection) {
  const rows = await query('SELECT COUNT(*) AS total FROM purchases WHERE idpackages = ?',
    [packageId], connection);
  return Number(rows[0].total);
}

async function remove(packageId, connection) {
  await query('DELETE FROM packages WHERE idpackages = ?', [packageId], connection);
}

module.exports = { list, findById, create, update, remove, purchaseCount };
