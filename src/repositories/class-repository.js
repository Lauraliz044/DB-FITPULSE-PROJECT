const { query } = require('../config/database');

const columns = `c.*, c.capacity - (
  SELECT COUNT(*) FROM reservations r WHERE r.class_id = c.id
) AS available_spots`;

async function list(limit, offset) {
  return query(`SELECT ${columns} FROM classes c ORDER BY c.starts_at, c.id
    LIMIT ? OFFSET ?`, [String(limit), String(offset)]);
}

async function findById(id, connection, lock = false) {
  const rows = await query(`SELECT ${columns} FROM classes c WHERE c.id = ?
    ${lock ? 'FOR UPDATE' : ''}`, [id], connection);
  return rows[0];
}

async function create(data) {
  const result = await query(`INSERT INTO classes
    (name, category, instructor_name, starts_at, ends_at, capacity, price, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [data.name, data.category, data.instructorName,
    data.startsAt, data.endsAt, data.capacity, data.price, data.description]);
  return findById(result.insertId);
}

async function update(id, data, connection) {
  await query(`UPDATE classes SET name = ?, category = ?, instructor_name = ?,
    starts_at = ?, ends_at = ?, capacity = ?, price = ?, description = ? WHERE id = ?`,
    [data.name, data.category, data.instructorName, data.startsAt, data.endsAt,
      data.capacity, data.price, data.description, id], connection);
  return findById(id, connection);
}

async function remove(id, connection) {
  await query('DELETE FROM classes WHERE id = ?', [id], connection);
}

async function reservationCount(id, connection) {
  const rows = await query('SELECT COUNT(*) AS total FROM reservations WHERE class_id = ?',
    [id], connection);
  return Number(rows[0].total);
}

module.exports = { list, findById, create, update, remove, reservationCount };
