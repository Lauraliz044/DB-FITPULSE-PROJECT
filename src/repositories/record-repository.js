const { query } = require('../config/database');

async function findById(id) {
  const rows = await query('SELECT idrecord AS id, user_id, exercise, record_type, value, unit, achieved_on FROM personal_records WHERE idrecord = ?', [id]);
  return rows[0];
}

async function list(userId, limit, offset) {
  return query(`SELECT idrecord AS id, user_id, exercise, record_type, value, unit, achieved_on FROM personal_records WHERE user_id = ?
    ORDER BY achieved_on DESC, idrecord DESC LIMIT ? OFFSET ?`,
    [userId, String(limit), String(offset)]);
}

async function create(userId, data) {
  const result = await query(`INSERT INTO personal_records
    (user_id, exercise, record_type, value, unit, achieved_on) VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, data.exercise, data.recordType, data.value, data.unit, data.achievedOn]);
  return findById(result.insertId);
}

async function update(id, data) {
  await query(`UPDATE personal_records SET exercise = ?, record_type = ?, value = ?,
    unit = ?, achieved_on = ? WHERE idrecord = ?`,
    [data.exercise, data.recordType, data.value, data.unit, data.achievedOn, id]);
  return findById(id);
}

async function remove(id) {
  await query('DELETE FROM personal_records WHERE idrecord = ?', [id]);
}

module.exports = { findById, list, create, update, remove };
