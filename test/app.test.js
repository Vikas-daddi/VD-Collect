const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const fs = require('node:fs');
const vm = require('node:vm');

// Tests never use the configured database or send email.
const connectDB = require('../config/db');
let databaseUnavailable = false;
require.cache[require.resolve('../config/db')].exports = async () => {
  if (databaseUnavailable) throw new Error('offline');
};
require.cache[require.resolve('../utils/emailService')] = {
  id: require.resolve('../utils/emailService'), loaded: true,
  exports: { sendEmail: async () => {} },
};
process.env.JWT_SECRET = 'local-regression-test-secret';
const app = require('../server');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Center = require('../models/Center');
let server;
let base;
const citizen = '111111111111111111111111';
const collector = '222222222222222222222222';
const bookingId = '333333333333333333333333';
const centerId = '444444444444444444444444';
const request = (path, { role, id = citizen, body, method = 'GET' } = {}) => fetch(base + path, {
  method, headers: {
    ...(role ? { Authorization: `Bearer ${jwt.sign({ id, role }, process.env.JWT_SECRET)}` } : {}),
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
  }, body: body === undefined ? undefined : JSON.stringify(body),
});

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));

test('all app pages and local scripts load', async () => {
  for (const path of ['/', '/login', '/register', '/map', '/book', '/dashboard', '/admin', '/collector', '/success', '/js/ui.js']) {
    const res = await request(path);
    assert.equal(res.status, 200, path);
    assert.ok((await res.text()).length > 100, path);
  }
});

test('ping works during database failure; APIs return 503 and JSON', async () => {
  databaseUnavailable = true;
  try {
    assert.equal((await request('/api/ping')).status, 200);
    const res = await request('/api/centers');
    assert.equal(res.status, 503);
    assert.match((await res.json()).message, /Database unavailable/);
  } finally { databaseUnavailable = false; }
});

test('seed endpoints and unknown API paths return JSON 404', async () => {
  for (const path of ['/api/seed-centers', '/api/seed-collectors', '/api/no-such-route', '/api/auth/no-such-route']) {
    const res = await request(path);
    assert.equal(res.status, 404);
    assert.match(res.headers.get('content-type'), /application\/json/);
  }
});

test('invalid JSON returns 400', async () => {
  const res = await fetch(base + '/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad',
  });
  assert.equal(res.status, 400);
});

test('collector directory and assignments enforce roles', async () => {
  assert.equal((await request('/api/auth/collectors')).status, 401);
  assert.equal((await request('/api/auth/collectors', { role: 'citizen' })).status, 403);
  assert.equal((await request('/api/bookings/my-assignments', { role: 'citizen' })).status, 403);
});

test('invalid IDs, statuses and booking data return 400 before database access', async () => {
  assert.equal((await request('/api/bookings/bad', { role: 'admin', method: 'PUT', body: { status: 'completed' } })).status, 400);
  assert.equal((await request(`/api/bookings/${bookingId}`, { role: 'admin', method: 'PUT', body: { status: 'invalid' } })).status, 400);
  const valid = { centerId, items: [{ name: 'Laptop', quantity: 1 }], pickupAddress: 'Test address', pickupDate: '2099-12-01' };
  for (const body of [{ ...valid, items: [] }, { ...valid, items: [{ name: 'Laptop', quantity: -1 }] },
    { ...valid, pickupDate: '2000-01-01' }, { ...valid, image: '" onerror="alert(1)' }, { ...valid, pickupDate: '2099-02-30' }]) {
    assert.equal((await request('/api/bookings', { role: 'citizen', method: 'POST', body })).status, 400);
  }
});

test('collectors cannot complete another collector assignment or change other statuses', async t => {
  t.mock.method(Booking, 'findById', async () => ({ collector, status: 'pending' }));
  assert.equal((await request(`/api/bookings/${bookingId}`, { role: 'collector', method: 'PUT', body: { status: 'completed' } })).status, 403);
  assert.equal((await request(`/api/bookings/${bookingId}`, { role: 'collector', id: collector, method: 'PUT', body: { status: 'cancelled' } })).status, 403);
});

test('closed bookings cannot be reopened or awarded points again', async t => {
  t.mock.method(Booking, 'findById', async () => ({ status: 'completed' }));
  const award = t.mock.method(User, 'findByIdAndUpdate', async () => { throw new Error('Should not award'); });
  assert.equal((await request(`/api/bookings/${bookingId}`, { role: 'admin', method: 'PUT', body: { status: 'completed' } })).status, 200);
  assert.equal((await request(`/api/bookings/${bookingId}`, { role: 'admin', method: 'PUT', body: { status: 'pending' } })).status, 409);
  assert.equal(award.mock.callCount(), 0);
});

test('concurrent completion awards points only once', async t => {
  t.mock.method(Booking, 'findById', async () => ({ _id: bookingId, user: citizen, collector, status: 'pending', items: [{ quantity: 2 }] }));
  let changed = false;
  t.mock.method(Booking, 'findOneAndUpdate', async () => {
    if (changed) return null;
    changed = true;
    return { status: 'completed' };
  });
  const award = t.mock.method(User, 'findByIdAndUpdate', async (id, update) => {
    assert.deepEqual(update, { $inc: { points: 100 } });
    return { _id: citizen, points: 100, email: 'test@example.com', name: 'Test' };
  });
  const results = await Promise.all([1, 2].map(() => request(`/api/bookings/${bookingId}`, {
    role: 'collector', id: collector, method: 'PUT', body: { status: 'completed' },
  })));
  assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
  assert.equal(award.mock.callCount(), 1);
});

test('assignment rejects non-collectors', async t => {
  t.mock.method(User, 'findOne', async () => null);
  assert.equal((await request(`/api/bookings/${bookingId}/assign`, { role: 'admin', method: 'PUT', body: { collectorId: citizen } })).status, 400);
});

test('center updates preserve zero coordinates', async t => {
  const center = { latitude: 12, longitude: 77, save: async () => {} };
  t.mock.method(Center, 'findById', async () => center);
  const res = await request(`/api/centers/${centerId}`, { role: 'admin', method: 'PUT', body: { latitude: 0, longitude: 0 } });
  assert.equal(res.status, 200);
  assert.equal(center.latitude, 0);
  assert.equal(center.longitude, 0);
});

test('database connector rejects missing configuration and shares concurrent attempts', async t => {
  const saved = process.env.MONGO_URI;
  try {
    delete process.env.MONGO_URI;
    await assert.rejects(connectDB(), /MONGO_URI/);
    process.env.MONGO_URI = 'mongodb://test.invalid/test';
    const connect = t.mock.method(mongoose, 'connect', async () => { throw new Error('offline'); });
    const results = await Promise.allSettled([connectDB(), connectDB()]);
    assert.ok(results.every(r => r.status === 'rejected'));
    assert.equal(connect.mock.callCount(), 1);
    await assert.rejects(connectDB(), /offline/);
    assert.equal(connect.mock.callCount(), 2);
  } finally {
    if (saved === undefined) delete process.env.MONGO_URI;
    else process.env.MONGO_URI = saved;
  }
});

test('HTML text and image helpers reject injection', () => {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync('public/js/ui.js', 'utf8'), context);
  assert.equal(context.escapeHTML('<img src=x onerror="x">'), '&lt;img src=x onerror=&quot;x&quot;&gt;');
  assert.equal(context.safeImageURL('javascript:alert(1)'), '');
  assert.equal(context.safeImageURL('data:image/png;base64,YQ=='), 'data:image/png;base64,YQ==');
});
