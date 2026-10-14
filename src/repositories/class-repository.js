const { query } = require('../config/database');

const columns = `scheduled_class.idscheduled_classes AS id, scheduled_class.name,
  scheduled_class.category, scheduled_class.instructor_name, scheduled_class.starts_at,
  scheduled_class.ends_at, scheduled_class.capacity, scheduled_class.price, scheduled_class.description,
  scheduled_class.capacity - (SELECT COUNT(*) FROM reservations
    WHERE class_id = scheduled_class.idscheduled_classes) AS available_spots`;

async function list(limit, offset) {
  return query(`SELECT ${columns} FROM scheduled_classes scheduled_class
    ORDER BY scheduled_class.starts_at, scheduled_class.idscheduled_classes LIMIT ? OFFSET ?`,
    [String(limit), String(offset)]);
}

async function findById(classId, connection, lock = false) {
  let sql = `SELECT ${columns} FROM scheduled_classes scheduled_class
    WHERE scheduled_class.idscheduled_classes = ?`;
  if (lock) sql += ' FOR UPDATE';
  const rows = await query(sql, [classId], connection);
  return rows[0];
}

async function create(classData) {
  const result = await query(`INSERT INTO scheduled_classes
    (name, category, instructor_name, starts_at, ends_at, capacity, price, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [classData.name, classData.category, classData.instructorName,
    classData.startsAt, classData.endsAt, classData.capacity, classData.price, classData.description]);
  return findById(result.insertId);
}

async function update(classId, classData, connection) {
  await query(`UPDATE scheduled_classes SET name = ?, category = ?, instructor_name = ?,
    starts_at = ?, ends_at = ?, capacity = ?, price = ?, description = ?
    WHERE idscheduled_classes = ?`, [classData.name, classData.category, classData.instructorName,
    classData.startsAt, classData.endsAt, classData.capacity, classData.price,
    classData.description, classId], connection);
  return findById(classId, connection);
}

async function remove(classId, connection) {
  await query('DELETE FROM scheduled_classes WHERE idscheduled_classes = ?', [classId], connection);
}

async function reservationCount(classId, connection) {
  const rows = await query('SELECT COUNT(*) AS total FROM reservations WHERE class_id = ?',
    [classId], connection);
  return Number(rows[0].total);
}

module.exports = { list, findById, create, update, remove, reservationCount };
