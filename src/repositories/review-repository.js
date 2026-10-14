const { query } = require('../config/database');

const columns = `idreview AS id, iduser AS user_id, idclass AS class_id,
  rating, comment, intensity, tags, created_at, updated_at`;

function parseTags(review) {
  if (review && typeof review.tags === 'string') review.tags = JSON.parse(review.tags);
  return review;
}

async function findById(reviewId, connection) {
  const rows = await query(`SELECT ${columns} FROM reviews WHERE idreview = ?`, [reviewId], connection);
  return parseTags(rows[0]);
}

async function findByUserClass(userId, classId, connection) {
  const rows = await query('SELECT idreview AS id FROM reviews WHERE iduser = ? AND idclass = ?',
    [userId, classId], connection);
  return rows[0];
}

async function create(userId, reviewData, connection) {
  const result = await query(`INSERT INTO reviews
    (iduser, idclass, rating, comment, intensity, tags) VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, reviewData.classId, reviewData.rating, reviewData.comment,
    reviewData.intensity, JSON.stringify(reviewData.tags)], connection);
  return findById(result.insertId, connection);
}

async function update(reviewId, reviewData) {
  await query('UPDATE reviews SET rating = ?, comment = ?, intensity = ?, tags = ? WHERE idreview = ?',
    [reviewData.rating, reviewData.comment, reviewData.intensity, JSON.stringify(reviewData.tags), reviewId]);
  return findById(reviewId);
}

async function list(classId, limit, offset) {
  const rows = await query(`SELECT ${columns} FROM reviews WHERE idclass = ?
    ORDER BY created_at DESC, idreview DESC LIMIT ? OFFSET ?`, [classId, String(limit), String(offset)]);
  return rows.map(parseTags);
}

async function remove(reviewId) {
  await query('DELETE FROM reviews WHERE idreview = ?', [reviewId]);
}

module.exports = { findById, findByUserClass, create, update, list, remove };
