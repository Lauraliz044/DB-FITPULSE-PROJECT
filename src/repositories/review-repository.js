const { query } = require('../config/database');

function parseTags(item) {
  if (item && typeof item.tags === 'string') item.tags = JSON.parse(item.tags);
  return item;
}

async function findById(id) {
  const rows = await query('SELECT * FROM reviews WHERE reservation_id = ?', [id]);
  return parseTags(rows[0]);
}

async function create(data) {
  await query(`INSERT INTO reviews (reservation_id, rating, comment, intensity, tags)
    VALUES (?, ?, ?, ?, ?)`, [data.reservationId, data.rating, data.comment,
    data.intensity, JSON.stringify(data.tags)]);
  return findById(data.reservationId);
}

async function update(id, data) {
  await query('UPDATE reviews SET rating = ?, comment = ?, intensity = ?, tags = ? WHERE reservation_id = ?',
    [data.rating, data.comment, data.intensity, JSON.stringify(data.tags), id]);
  return findById(id);
}

async function list(classId, limit, offset) {
  const rows = await query(`SELECT v.* FROM reviews v JOIN reservations r
    ON r.id = v.reservation_id WHERE r.class_id = ?
    ORDER BY v.created_at DESC, v.reservation_id DESC LIMIT ? OFFSET ?`,
    [classId, String(limit), String(offset)]);
  return rows.map(parseTags);
}

async function remove(id) {
  await query('DELETE FROM reviews WHERE reservation_id = ?', [id]);
}

module.exports = { findById, create, update, list, remove };
