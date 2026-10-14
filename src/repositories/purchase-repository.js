const { query } = require('../config/database');

const details = `SELECT purchase.idpurchase AS id, purchase.idusers AS user_id,
  purchase.idpackages AS package_id, purchase.purchased_at, purchase.paid_price,
  buyer.name AS buyer_name, buyer.email AS buyer_email,
  package.name AS package_name, package.class_quantity FROM purchases purchase
  JOIN users buyer ON buyer.idusers = purchase.idusers
  JOIN packages package ON package.idpackages = purchase.idpackages`;

async function create(userId, packageId, price, connection) {
  const result = await query(`INSERT INTO purchases (idusers, idpackages, paid_price)
    VALUES (?, ?, ?)`, [userId, packageId, price], connection);
  return findById(result.insertId, connection);
}

async function findById(purchaseId, connection) {
  const rows = await query(`${details} WHERE purchase.idpurchase = ?`, [purchaseId], connection);
  return rows[0];
}

async function list(userId, limit, offset) {
  let sql = details;
  const parameters = [];
  if (userId) {
    sql += ' WHERE purchase.idusers = ?';
    parameters.push(userId);
  }
  sql += ' ORDER BY purchase.idpurchase DESC LIMIT ? OFFSET ?';
  parameters.push(String(limit), String(offset));
  return query(sql, parameters);
}

async function sales() {
  return query(`SELECT idpackages AS package_id, purchased_at, paid_price
    FROM purchases ORDER BY idpurchase`);
}

module.exports = { create, findById, list, sales };
