const { query } = require('../config/database');

const details = `SELECT reservation.idreservation AS id, reservation.user_id, reservation.class_id,
  reservation.created_at, reservation.status,
  scheduled_class.name AS class_name, scheduled_class.category,
  scheduled_class.starts_at, scheduled_class.ends_at FROM reservations reservation
  JOIN scheduled_classes scheduled_class
    ON scheduled_class.idscheduled_classes = reservation.class_id`;

async function findById(reservationId, connection, lock = false) {
  let sql = `${details} WHERE reservation.idreservation = ?`;
  if (lock) sql += ' FOR UPDATE';
  const rows = await query(sql, [reservationId], connection);
  return rows[0];
}

async function findByUserClass(userId, classId, connection) {
  const rows = await query(`${details} WHERE reservation.user_id = ? AND reservation.class_id = ?`,
    [userId, classId], connection);
  return rows[0];
}

async function create(userId, classId, connection) {
  const result = await query('INSERT INTO reservations (user_id, class_id) VALUES (?, ?)',
    [userId, classId], connection);
  return findById(result.insertId, connection);
}

async function list(userId, status, limit, offset) {
  let sql = `${details} WHERE reservation.user_id = ?`;
  const parameters = [userId];
  if (status) {
    sql += ' AND reservation.status = ?';
    parameters.push(status);
  }
  sql += ' ORDER BY scheduled_class.starts_at DESC, reservation.idreservation DESC LIMIT ? OFFSET ?';
  parameters.push(String(limit), String(offset));
  return query(sql, parameters);
}

async function attendance(reservationId, status, connection) {
  await query('UPDATE reservations SET status = ? WHERE idreservation = ?',
    [status, reservationId], connection);
  return findById(reservationId, connection);
}

async function attended(userId) {
  return query(`${details} WHERE reservation.user_id = ? AND reservation.status = 'attended'`, [userId]);
}

module.exports = { findById, findByUserClass, create, list, attendance, attended };
