const mysql = require('mysql2/promise');
const settings = require('./settings');

const pool = mysql.createPool(settings.database);

async function query(sql, parameters = [], connection = pool) {
  if (connection !== pool) {
    const [rows] = await connection.execute(sql, parameters);
    return rows;
  }
  const borrowed = await pool.getConnection();
  try {
    await borrowed.query("SET time_zone = '+00:00'");
    const [rows] = await borrowed.execute(sql, parameters);
    return rows;
  } finally {
    borrowed.release();
  }
}

async function transaction(action) {
  const connection = await pool.getConnection();
  try {
    await connection.query("SET time_zone = '+00:00'");
    await connection.beginTransaction();
    const result = await action(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { pool, query, transaction };
