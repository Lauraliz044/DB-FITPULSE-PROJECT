const { fail } = require('./errors');

function fields(body, allowed, required = []) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    fail(400, 'A JSON object is required');
  }
  for (const key of Object.keys(body)) {
    if (!allowed.includes(key)) fail(400, `Unknown field: ${key}`);
  }
  for (const key of required) {
    if (body[key] === undefined || body[key] === null) {
      fail(400, `${key} is required`);
    }
  }
}

function text(value, name, maxLength, nullable = false) {
  if (value === null && nullable) return null;
  if (typeof value !== 'string' || !value.trim() ||
      [...value.trim()].length > maxLength) {
    fail(400, `${name} must be nonempty text of at most ${maxLength} characters`);
  }
  return value.trim();
}

function integer(value, name, minimum = 1, maximum = 4294967295) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    fail(400, `${name} must be an integer between ${minimum} and ${maximum}`);
  }
  return value;
}

function identifier(value, name = 'id') {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    fail(400, `${name} must be a positive integer`);
  }
  return integer(Number(value), name);
}

function decimal(value, name, maxValue, scale, minimum = 0) {
  if (typeof value !== 'number' || !Number.isFinite(value) ||
      value < minimum || value > maxValue ||
      Math.abs(value * 10 ** scale - Math.round(value * 10 ** scale)) > 0.00001) {
    fail(400, `${name} has an invalid value or decimal precision`);
  }
  return value.toFixed(scale);
}

function choice(value, name, allowed) {
  if (!allowed.includes(value)) fail(400, `${name} must be one of: ${allowed.join(', ')}`);
  return value;
}

function date(value, name) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    fail(400, `${name} must use YYYY-MM-DD`);
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value ||
      value < '1000-01-01') {
    fail(400, `${name} is not a valid date`);
  }
  return value;
}

function timestamp(value, name) {
  if (typeof value !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.test(value)) {
    fail(400, `${name} must include seconds and a time zone`);
  }
  date(value.slice(0, 10), name);
  const hour = Number(value.slice(11, 13));
  const minute = Number(value.slice(14, 16));
  const second = Number(value.slice(17, 19));
  if (hour > 23 || minute > 59 || second > 59) {
    fail(400, `${name} contains an invalid time`);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime()) || parsed.getUTCFullYear() > 9999 ||
      parsed.getUTCFullYear() < 1000) {
    fail(400, `${name} is not a valid timestamp`);
  }
  return parsed.toISOString().slice(0, 19).replace('T', ' ');
}

function pagination(query, extra = []) {
  fields(query, ['limit', 'offset', ...extra]);
  const limit = query.limit === undefined ? 100 : identifier(query.limit, 'limit');
  if (limit > 1000) fail(400, 'limit cannot exceed 1000');
  const offsetText = query.offset === undefined ? '0' : query.offset;
  if (typeof offsetText !== 'string' || !/^\d+$/.test(offsetText)) {
    fail(400, 'offset must be a nonnegative integer');
  }
  const offset = integer(Number(offsetText), 'offset', 0);
  return { limit, offset };
}

module.exports = {
  fields, text, integer, identifier, decimal, choice, date, timestamp, pagination
};
