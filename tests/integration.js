require('dotenv').config({ quiet: true });
process.env.DB_NAME = process.env.TEST_DB_NAME;
if (!process.env.DB_NAME || !process.env.DB_NAME.endsWith('_test')) {
  throw new Error('TEST_DB_NAME must end with _test');
}

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const app = require('../src/app');
const values = { admin: 'admin', client: 'client', active: 'active' };
const { checkSchema } = require('../src/config/schema');
const { pool, query } = require('../src/config/database');
const progress = require('../src/services/progress-service');
const { businessDate, utcDate } = require('../src/utils/time');

const evidence = [];
const runId = Date.now();
let baseUrl;
let server;
let assertions = 0;

function verify(condition, message) {
  assert.ok(condition, message);
  assertions += 1;
}

async function call(method, route, body, token, expected, label) {
  const start = performance.now();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${baseUrl}/api/v1${route}`, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body)
  });
  const responseText = await response.text();
  const json = responseText ? JSON.parse(responseText) : null;
  const safeBody = body ? { ...body } : null;
  if (safeBody && safeBody.password) safeBody.password = '[redacted]';
  const safeJson = json ? JSON.parse(JSON.stringify(json)) : null;
  if (safeJson && safeJson.data && safeJson.data.accessToken) {
    safeJson.data.accessToken = '[redacted]';
  }
  evidence.push({ label, method, route, requestBody: safeBody,
    authenticated: Boolean(token), expectedStatus: expected, status: response.status,
    passed: Array.isArray(expected) ? expected.includes(response.status) : response.status === expected,
    milliseconds: performance.now() - start,
    responseBody: safeJson });
  if (Array.isArray(expected)) {
    assert.ok(expected.includes(response.status), `${label}: ${responseText}`);
  } else {
    assert.equal(response.status, expected,
      `${label}: ${method} ${route}: ${responseText}`);
  }
  assertions += 1;
  return json ? json.data : undefined;
}

function futureClass(name, capacity = 3) {
  return { name, category: 'yoga', instructorName: 'Demo Coach',
    startsAt: new Date(Date.now() + 86400000 * 2).toISOString(),
    endsAt: new Date(Date.now() + 86400000 * 2 + 3600000).toISOString(),
    capacity, price: 25000, description: 'Mobility and breathing' };
}

async function pastReservation(userId, weeksAgo = 1) {
  const start = new Date(Date.now() - weeksAgo * 7 * 86400000);
  const end = new Date(start.getTime() + 3600000);
  const item = await query(`INSERT INTO scheduled_classes
    (name, category, instructor_name, starts_at, ends_at, capacity, price, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [`Past Yoga ${runId}`, 'yoga', 'Demo Coach', start, end, 20, '25000.00', 'Past fixture']);
  const reservation = await query('INSERT INTO reservations (user_id, class_id) VALUES (?, ?)',
    [userId, item.insertId]);
  return { id: reservation.insertId, classId: item.insertId };
}

async function loadTest(route, token) {
  const times = [];
  await Promise.all(Array.from({ length: 50 }, async () => {
    const start = performance.now();
    const response = await fetch(`${baseUrl}/api/v1${route}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    verify(response.status === 200, 'Concurrent query must succeed');
    await response.text();
    times.push(performance.now() - start);
  }));
  times.sort((first, second) => first - second);
  return { concurrentRequests: 50, p95Milliseconds: times[47],
    passed: times[47] <= 1000 };
}

async function run() {
  const schema = await fs.readFile(path.join(__dirname, '../database/schema.sql'), 'utf8');
  for (const statement of schema.split(';').filter((value) => value.trim())) {
    await query(statement);
  }
  await checkSchema(pool);
  server = await new Promise((resolve) => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  const adminEmail = `admin${runId}@fitpulse.example`;
  const password = process.env.ADMIN_PASSWORD;
  await query('INSERT INTO users (name, email, `password`, role, status) VALUES (?, ?, ?, ?, ?)',
    ['Demo Admin', adminEmail, password, values.admin, values.active]);
  const session = await call('POST', '/sessions', { email: adminEmail, password }, null,
    201, 'Administrator session');
  const admin = session.accessToken;
  await call('POST', '/sessions', { email: adminEmail, password: 'WrongPassword' }, null,
    401, 'Wrong credentials');
  const client = await call('POST', '/users', {
    name: 'Demo Client', email: `client${runId}@fitpulse.example`, password
  }, null, 201, 'Registration');
  await call('POST', '/users', { name: 'Demo', email: 'bad', password: 'short' }, null,
    400, 'Invalid registration');
  await call('POST', '/users', { name: 'x'.repeat(46),
    email: `long${runId}@fitpulse.example`, password }, null, 400, 'User name exceeds database length');
  await call('POST', '/users', { name: 'Demo', email: client.email, password }, null,
    409, 'Duplicate email');
  await call('POST', '/users', { name: 'Demo', email: 'other@example.com', password,
    role: 'admin' }, null, 400, 'Public role escalation rejected');
  const clientSession = await call('POST', '/sessions', { email: client.email, password },
    null, 201, 'Client session');
  const token = clientSession.accessToken;
  verify(!('password' in clientSession.user), 'Password must not be returned');
  await call('GET', '/users', undefined, admin, 200, 'User list');
  await call('GET', '/users', undefined, token, 403, 'Client cannot list users');
  await call('GET', `/users/${client.id}`, undefined, token, 200, 'Own profile');
  await call('GET', '/users/0', undefined, token, 400, 'Invalid identifier');
  await call('PATCH', `/users/${client.id}/status`, { status: 'inactive' }, admin,
    200, 'Deactivate client');
  await call('GET', '/classes', undefined, token, 403, 'Existing token rejected after deactivation');
  await call('PATCH', `/users/${client.id}/status`, { status: 'active' }, token,
    403, 'Client cannot reactivate itself');
  await call('PATCH', `/users/${client.id}/status`, { status: 'active' }, admin,
    200, 'Reactivate client');
  const item = await call('POST', '/classes', futureClass('Future Yoga'), admin,
    201, 'Create class');
  await call('POST', '/classes', futureClass('Forbidden'), token, 403, 'Client cannot create class');
  await call('POST', '/classes', { ...futureClass('Invalid'), capacity: '3' }, admin,
    400, 'Wrong capacity type');
  await call('POST', '/classes', { ...futureClass('Long instructor'), instructorName: 'x'.repeat(46) },
    admin, 400, 'instructor_name name exceeds database length');
  await call('POST', '/classes', { ...futureClass('Invalid time'),
    startsAt: '2030-01-01T24:00:00Z' }, admin, 400, 'Invalid hour');
  await call('GET', '/classes', undefined, token, 200, 'Class catalog');
  await call('GET', '/classes?limit=1001', undefined, token, 400, 'Invalid pagination');
  await call('GET', `/classes/${item.id}`, undefined, token, 200, 'Class details');
  await call('GET', '/classes/2147483647', undefined, token, 404, 'Missing class');
  await call('PATCH', `/classes/${item.id}`, { capacity: 4 }, admin, 200, 'Update class');
  await call('PATCH', `/classes/${item.id}`, { capacity: 0 }, admin, 400, 'Invalid class update');
  const disposable = await call('POST', '/classes', futureClass('Disposable'), admin,
    201, 'Create disposable class');
  await call('DELETE', `/classes/${disposable.id}`, undefined, admin, 204, 'Delete class');
  await call('DELETE', `/classes/${disposable.id}`, undefined, admin, 404, 'Delete missing class');
  const bundle = await call('POST', '/packages', { name: 'Starter', classQuantity: 5,
    price: 120000, description: 'Five classes' }, admin, 201, 'Create package');
  await call('POST', '/packages', { name: 'Invalid' }, admin, 400, 'Invalid package');
  await call('POST', '/packages', { name: 'x'.repeat(46), classQuantity: 1,
    price: 1, description: 'Test fixture' }, admin, 400, 'Package name exceeds database length');
  await call('GET', '/packages', undefined, token, 200, 'Package catalog');
  await call('GET', '/packages?limit=0', undefined, token, 400, 'Invalid package pagination');
  await call('GET', `/packages/${bundle.id}`, undefined, token, 200, 'Package details');
  await call('GET', '/packages/2147483647', undefined, token, 404, 'Missing package');
  await call('PATCH', `/packages/${bundle.id}`, { price: 125000 }, admin,
    200, 'Update package');
  await call('PATCH', `/packages/${bundle.id}`, { price: -1 }, admin,
    400, 'Invalid package price');
  const spare = await call('POST', '/packages', { name: 'Disposable', classQuantity: 1,
    price: 1, description: 'Test fixture' }, admin, 201, 'Create disposable package');
  await call('DELETE', `/packages/${spare.id}`, undefined, admin, 204, 'Delete package');
  await call('DELETE', `/packages/${spare.id}`, undefined, admin, 404, 'Delete missing package');
  const purchase = await call('POST', '/purchases', { packageId: bundle.id }, token,
    201, 'Buy package');
  verify(purchase.paid_price === '125000.00', 'Server must choose paid price');
  await call('POST', '/purchases', { packageId: bundle.id, paidPrice: 1 }, token,
    400, 'Buyer cannot forge price');
  await call('GET', '/purchases', undefined, admin, 200, 'Admin purchase details');
  await call('GET', '/purchases', undefined, token, 403, 'Client cannot list all purchases');
  await call('GET', `/purchases/${purchase.id}`, undefined, token, 200, 'Own purchase');
  await call('GET', '/purchases/2147483647', undefined, token, 404, 'Missing purchase');
  await call('GET', `/users/${client.id}/purchases`, undefined, token, 200, 'Own purchases');
  await call('GET', `/users/${session.user.id}/purchases`, undefined, token, 403,
    'Different user purchases rejected');
  await call('PATCH', `/packages/${bundle.id}`, { price: 1 }, admin, 409,
    'Purchased package history protected');
  const reservation = await call('POST', '/reservations', { classId: item.id }, token,
    201, 'Reserve class');
  await call('POST', '/reservations', { classId: item.id }, token, 409, 'Duplicate reservation');
  await call('GET', `/reservations/${reservation.id}`, undefined, token, 200,
    'Reservation details');
  await call('GET', '/reservations/2147483647', undefined, token, 404, 'Missing reservation');
  await call('GET', `/users/${client.id}/reservations?status=reserved`, undefined,
    token, 200, 'Reserved classes');
  await call('GET', `/users/${client.id}/reservations?status=wrong`, undefined,
    token, 400, 'Invalid reservation filter');
  await call('PATCH', `/classes/${item.id}`, { category: 'crossfit' }, admin,
    409, 'Reserved class history protected');
  await call('PATCH', `/reservations/${reservation.id}/attendance`, { status: 'attended' },
    admin, 409, 'Future attendance rejected');
  await call('POST', '/reviews', { classId: item.id, rating: 5 }, token,
    409, 'Review before attendance rejected');
  const past = await pastReservation(client.id);
  await call('POST', '/reservations', { classId: past.classId }, token,
    409, 'Past class reservation rejected');
  await call('PATCH', `/reservations/${past.id}/attendance`, { status: 'attended' },
    admin, 200, 'Record attendance');
  await call('GET', `/users/${client.id}/reservations?status=attended`, undefined,
    token, 200, 'Attended classes');
  const review = await call('POST', '/reviews', { classId: past.classId, rating: 5,
    comment: 'Clear instructions', intensity: 'moderate', tags: ['Friendly','organized'] },
    token, 201, 'Create review with optional attributes');
  await call('POST', '/reviews', { classId: past.classId, rating: 5 }, token,
    409, 'Duplicate review');
  await call('GET', `/reviews/${review.id}`, undefined, token, 200, 'Review details');
  await call('GET', '/reviews/2147483647', undefined, token, 404, 'Missing review');
  await call('GET', `/classes/${past.classId}/reviews`, undefined, token, 200,
    'Class reviews');
  await call('GET', '/classes/2147483647/reviews', undefined, token, 404,
    'Reviews of missing class');
  const changed = await call('PATCH', `/reviews/${review.id}`, { tags: [] }, token,
    200, 'Clear review tags');
  verify(changed.comment === 'Clear instructions' && changed.intensity === 'moderate',
    'PATCH must preserve omitted fields');
  await call('PATCH', `/reviews/${review.id}`, { tags: ['good','GOOD'] }, token,
    400, 'Duplicate tags rejected');
  verify(review.user_id === client.id && review.class_id === past.classId,
    'Review must keep its own identifier and direct user/class references');
  await call('PATCH', `/reviews/${review.id}`, { classId: item.id }, token,
    400, 'Reviewed class cannot be replaced');
  await call('DELETE', `/reviews/${review.id}`, undefined, token, 204, 'Delete review');
  const afterDeletion = await call('GET', `/users/${client.id}/progress`, undefined, token,
    200, 'Deleting a review preserves recorded attendance');
  verify(afterDeletion.totalAttended === 1, 'Attendance must be independent of reviews');
  await call('DELETE', `/reviews/${review.id}`, undefined, token, 404, 'Delete missing review');
  const replacementReview = await call('POST', '/reviews', { classId: past.classId, rating: 4 }, token,
    201, 'Optional review fields can be omitted');
  const record = await call('POST', `/users/${client.id}/personal-records`, {
    exercise: 'Deadlift', recordType: 'maximum_weight', value: 80,
    unit: 'kg', achievedOn: businessDate()
  }, token, 201, 'Create personal record');
  await call('POST', `/users/${client.id}/personal-records`, { exercise: 'Deadlift' },
    token, 400, 'Incomplete personal record');
  await call('POST', `/users/${client.id}/personal-records`, { exercise: 'Deadlift',
    recordType: 'x'.repeat(46), value: 80, unit: 'kg', achievedOn: businessDate() }, token,
    400, 'Record type exceeds database length');
  await call('GET', `/users/${client.id}/personal-records`, undefined, token,
    200, 'Personal records list');
  await call('GET', `/users/${session.user.id}/personal-records`, undefined, token,
    403, 'Different user records rejected');
  await call('GET', `/personal-records/${record.id}`, undefined, token,
    200, 'Personal record details');
  await call('GET', '/personal-records/2147483647', undefined, token,
    404, 'Missing personal record');
  await call('PATCH', `/personal-records/${record.id}`, { value: 85 }, token,
    200, 'Update personal record');
  await call('PATCH', `/personal-records/${record.id}`, { achievedOn: '2026-02-30' },
    token, 400, 'Invalid calendar date');
  await call('DELETE', `/personal-records/${record.id}`, undefined, token,
    204, 'Delete personal record');
  await call('DELETE', `/personal-records/${record.id}`, undefined, token,
    404, 'Delete missing personal record');
  const noShow = await pastReservation(client.id, 2);
  await call('PATCH', `/reservations/${noShow.id}/attendance`, { status: 'no_show' }, admin,
    200, 'Record absence after class completion');
  await call('POST', '/reviews', { classId: noShow.classId, rating: 5 }, token,
    409, 'An absent client cannot review a class');
  await call('PATCH', `/reservations/${noShow.id}/attendance`, { status: 'attended' }, admin,
    409, 'Final attendance state cannot be overwritten');
  const stats = await call('GET', `/users/${client.id}/progress`, undefined, token,
    200, 'Weekly streak and category totals');
  verify(stats.weeklyStreak === 1 && stats.categoryTotals.yoga === 1,
    'One attended class in the previous week must count');
  verify(evidence[evidence.length - 1].milliseconds <= 10000,
    'Progress query must finish within ten seconds');
  await call('GET', `/users/${session.user.id}/progress`, undefined, token,
    403, 'Different user progress rejected');
  await call('PATCH', `/reservations/${reservation.id}/attendance`, { status: 'attended' }, token,
    403, 'Client cannot register its own attendance');
  const summary = await call('GET', `/reports/sales?date=${businessDate()}`,
    undefined, admin, 200, 'Daily sales report');
  verify(Number(summary.totalPaid) >= 125000, 'Daily report must include the purchase');
  await call('GET', '/reports/sales', undefined, token, 403, 'Client cannot read sales');
  await call('GET', '/reports/sales?date=2026-02-30', undefined, admin,
    400, 'Invalid sales date');
  await call('GET', '/classes', undefined, undefined, 401, 'Missing token');
  await call('GET', '/classes', undefined, 'invalid-token', 401, 'Invalid token');
  await call('GET', '/classes?offset=-1', undefined, token, 400, 'Negative offset');
  await call('GET', '/classes?unexpected=1', undefined, token, 400, 'Unknown query');
  const other = await call('POST', '/users', { name: 'Other Client',
    email: `other${runId}@fitpulse.example`, password }, null, 201, 'Second client');
  const otherSession = await call('POST', '/sessions', { email: other.email, password },
    null, 201, 'Second client session');
  await call('GET', `/reservations/${reservation.id}`, undefined,
    otherSession.accessToken, 403, 'Reservation ownership');
  await call('PATCH', `/reviews/${replacementReview.id}`, { rating: 1 }, otherSession.accessToken,
    403, 'Review ownership');
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    await call('POST', '/sessions', { email: other.email, password: 'WrongPassword' }, null,
      attempt === 5 ? 423 : 401, `Failed login attempt ${attempt}`);
  }
  await call('POST', '/sessions', { email: other.email, password }, null,
    423, 'Correct password rejected during lock');
  const locked = await query('SELECT failed_login_attempts, locked_until FROM users WHERE idusers = ?',
    [other.id]);
  verify(locked[0].failed_login_attempts === 5, 'Failed attempt counter must persist');
  const lockSeconds = (utcDate(locked[0].locked_until) - new Date()) / 1000;
  verify(lockSeconds > 890 && lockSeconds <= 900, 'Lock must last approximately 15 minutes');
  await query('UPDATE users SET locked_until = DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 SECOND) WHERE idusers = ?',
    [other.id]);
  await call('POST', '/sessions', { email: other.email, password }, null,
    201, 'Login after simulated lock expiry');
  const single = await call('POST', '/classes', futureClass('Last Spot',1), admin,
    201, 'Create class with one spot');
  const beforeConcurrent = evidence.length;
  const concurrent = await Promise.all([
    call('POST', '/reservations', { classId: single.id }, token, [201,409], 'Concurrent reservation A'),
    call('POST', '/reservations', { classId: single.id }, otherSession.accessToken,
      [201,409], 'Concurrent reservation B')
  ]);
  verify(JSON.stringify(evidence.slice(beforeConcurrent).map(testCase => testCase.status).sort()) === '[201,409]',
    'The last available spot must have one success and one conflict');
  verify(concurrent.length === 2, 'Both concurrent requests must complete');
  const count = await query('SELECT COUNT(*) AS total FROM reservations WHERE class_id = ?',
    [single.id]);
  verify(Number(count[0].total) === 1, 'Concurrent requests cannot exceed capacity');
  await assert.rejects(query(
    'INSERT INTO purchases (idusers, idpackages, paid_price) VALUES (?, ?, ?)',
    [2147483647, bundle.id, '1.00']
  ), { code: 'ER_NO_REFERENCED_ROW_2' });
  assertions += 1;
  await assert.rejects(query(
    'INSERT INTO reservations (user_id, class_id) VALUES (?, ?)',
    [client.id, item.id]
  ), { code: 'ER_DUP_ENTRY' });
  assertions += 1;
  await assert.rejects(query(
    'INSERT INTO reviews (iduser, idclass, rating, tags) VALUES (?, ?, ?, ?)',
    [client.id, item.id, 6, '[]']
  ), { code: 'ER_CHECK_CONSTRAINT_VIOLATED' });
  assertions += 1;
  await assert.rejects(query(
    'INSERT INTO reviews (iduser, idclass, rating, tags) VALUES (?, ?, ?, ?)',
    [client.id, past.classId, 5, '[]']
  ), { code: 'ER_DUP_ENTRY' });
  assertions += 1;
  await assert.rejects(query(
    'INSERT INTO reviews (iduser, idclass, rating, tags) VALUES (?, ?, ?, ?)',
    [client.id, 2147483647, 5, '[]']
  ), { code: 'ER_NO_REFERENCED_ROW_2' });
  assertions += 1;
  const crossYear = progress.calculate([
    { starts_at: '2025-12-29 13:00:00', category: 'yoga' },
    { starts_at: '2026-01-05 13:00:00', category: 'spinning' },
    { starts_at: '2026-01-06 13:00:00', category: 'spinning' }
  ], '2026-01-12');
  verify(crossYear.weeklyStreak === 2 && crossYear.categoryTotals.spinning === 2,
    'Weekly streak must cross year boundaries and deduplicate weeks');
  verify(businessDate(new Date('2026-10-14T04:59:59Z')) === '2026-10-13',
    'Business day must use Bogota time');
  const boundaryPurchase = await query(`INSERT INTO purchases
    (idusers, idpackages, purchased_at, paid_price) VALUES (?, ?, ?, ?)`,
    [client.id, bundle.id, '2020-01-02 04:59:59', '0.01']);
  const boundaryReport = await call('GET', '/reports/sales?date=2020-01-01',
    undefined, admin, 200, 'Sales across the UTC day boundary');
  verify(Number(boundaryReport.totalPaid) >= 0.01, 'Sales must use the business day');
  await query('DELETE FROM purchases WHERE idpurchase = ?', [boundaryPurchase.insertId]);
  const specification = await fetch(`${baseUrl}/openapi.json`);
  const spec = await specification.json();
  verify(Object.values(spec.paths).reduce((sum, item) => sum + Object.keys(item).length,0) === 35,
    'Swagger must document all operations');
  const docs = await fetch(`${baseUrl}/docs/`);
  verify(docs.status === 200 && (await docs.text()).includes('swagger-ui'),
    'Interactive Swagger must be served');
  const coverage = [];
  for (const [route, methods] of Object.entries(spec.paths)) {
    const pattern = new RegExp(`^${route.replace(/\{\w+\}/g, '[0-9]+')}$`);
    for (const method of Object.keys(methods)) {
      const cases = evidence.filter((item) => item.method.toLowerCase() === method &&
        pattern.test(item.route.split('?')[0]));
      const success = cases.some((item) => item.status < 300);
      const error = cases.some((item) => item.status >= 400);
      verify(success && error, `Success and error coverage missing for ${method} ${route}`);
      coverage.push({ method, route, success, error });
    }
  }
  const catalogLoad = await loadTest('/classes', token);
  const personalLoad = await loadTest(`/users/${client.id}/reservations`, token);
  const [tables] = await query('SELECT COUNT(*) AS total FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()');
  const [columns] = await query('SELECT COUNT(*) AS total FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()');
  const [foreignKeys] = await query('SELECT COUNT(*) AS total FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE()');
  verify(Number(tables.total) === 7 && Number(columns.total) === 49 && Number(foreignKeys.total) === 7,
    'Complete model must have seven tables, 49 columns and seven foreign keys');
  return { passed: true, assertions, httpCases: evidence.length, coverage,
    mysqlVersion: (await query('SELECT VERSION() AS version'))[0].version,
    catalogLoad, personalLoad, executedAt: new Date().toISOString(),
    fixtureNote: 'Disposable synthetic data in TEST_DB_NAME; no production database is reset.' };
}

async function main() {
  let summary;
  try {
    summary = await run();
    console.log(JSON.stringify(summary, null, 2));
  } catch (error) {
    summary = { passed: false, assertions, httpCases: evidence.length,
      message: error.message, executedAt: new Date().toISOString() };
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await fs.mkdir(path.join(__dirname, '../evidence'), { recursive: true });
    await fs.writeFile(path.join(__dirname, '../evidence/test-results.json'),
      JSON.stringify({ summary, cases: evidence }, null, 2));
    const collection = {
      info: { name: 'FitPulse - Recorded HTTP evidence',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        description: 'Actual requests and responses from npm test. ' +
          'Synthetic fixture IDs refer to TEST_DB_NAME. ' +
          'This is captured integration-test evidence; Postman was not used to execute it. ' +
          'Set baseUrl and accessToken for manual exploration. ' +
          'Rerun npm test for a reproducible complete run.' },
      variable: [{ key: 'baseUrl', value: process.env.BASE_URL || 'http://localhost:5000' },
        { key: 'accessToken', value: '' }, { key: 'password', value: '' }],
      item: evidence.map((item, index) => {
        const body = item.requestBody ? { ...item.requestBody } : undefined;
        if (body && body.password === '[redacted]') body.password = '{{password}}';
        const request = { method: item.method,
          url: '{{baseUrl}}/api/v1' + item.route,
          header: [{ key: 'Content-Type', value: 'application/json' }],
          description: 'Recorded expected status: ' + JSON.stringify(item.expectedStatus) };
        if (item.authenticated) request.auth = { type: 'bearer',
          bearer: [{ key: 'token', value: '{{accessToken}}', type: 'string' }] };
        if (body) request.body = { mode: 'raw', raw: JSON.stringify(body, null, 2),
          options: { raw: { language: 'json' } } };
        return { name: String(index + 1).padStart(3, '0') + ' - ' + item.label, request,
          response: [{ name: item.label, originalRequest: request,
            status: item.status < 300 ? 'Success' : 'Expected error', code: item.status,
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: item.responseBody ? JSON.stringify(item.responseBody, null, 2) : '',
            _postman_previewlanguage: 'json' }] };
      })
    };
    await fs.writeFile(path.join(__dirname, '../docs/FitPulse.postman_collection.json'),
      JSON.stringify(collection, null, 2));
    if (server) await new Promise((resolve) => server.close(resolve));
    await pool.end();
  }
}

main();
