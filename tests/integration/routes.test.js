'use strict';

/**
 * Integration tests for key application routes.
 *
 * Validates: Requirements 9.2, 9.3, 10.1, 10.5, 10.7
 *
 * Covers:
 *  - GET /health → 200 without X-User-Id header
 *  - GET /api-docs → 200 (or redirect) without X-User-Id header
 *  - Protected routes without X-User-Id → 401
 *  - 500 error response format: { error: { code, message } }, no internal details exposed
 */

// Use in-memory SQLite for tests — must be set before any app/model imports
process.env.DB_PATH = ':memory:';

const request = require('supertest');
const express = require('express');

// Import app after setting DB_PATH
const app = require('../../src/app');
const { sequelize } = require('../../src/models/index');

// ─── DB lifecycle ─────────────────────────────────────────────────────────────

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

// ─── GET /health ──────────────────────────────────────────────────────────────

describe('GET /health', () => {
  /**
   * Validates: Requirement 10.7 — health endpoint accessible without authentication
   */
  it('returns 200 without X-User-Id header', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
  });

  it('returns a JSON body with status "ok"', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok' });
    expect(typeof res.body.uptime).toBe('number');
    expect(typeof res.body.timestamp).toBe('string');
  });
});

// ─── GET /api-docs ────────────────────────────────────────────────────────────

describe('GET /api-docs', () => {
  /**
   * Validates: Requirement 9.3 — /api-docs is publicly accessible (no auth required)
   */
  it('returns 200 or redirect without X-User-Id header', async () => {
    const res = await request(app).get('/api-docs');

    // Swagger UI may redirect /api-docs → /api-docs/ (301/302) or serve directly (200)
    expect([200, 301, 302]).toContain(res.status);
  });

  it('returns 200 when following redirects', async () => {
    const res = await request(app).get('/api-docs/').redirects(5);

    expect(res.status).toBe(200);
  });
});

// ─── Protected routes without X-User-Id → 401 ────────────────────────────────

describe('Protected routes without X-User-Id header', () => {
  /**
   * Validates: Requirements 9.2, 9.3 — all protected routes require X-User-Id
   */
  const protectedRoutes = [
    { method: 'get', path: '/exercises' },
    { method: 'get', path: '/sets' },
    { method: 'get', path: '/profile' },
    { method: 'get', path: '/programs' },
    { method: 'get', path: '/dishes' },
    { method: 'get', path: '/meal-logs' },
    { method: 'get', path: '/sleep-logs' },
    { method: 'get', path: '/progress/stats' },
    { method: 'get', path: '/recommendations' },
  ];

  protectedRoutes.forEach(({ method, path }) => {
    it(`${method.toUpperCase()} ${path} → 401 without X-User-Id`, async () => {
      const res = await request(app)[method](path);

      expect(res.status).toBe(401);
    });
  });

  it('returns 401 error body with UNAUTHORIZED code', async () => {
    const res = await request(app).get('/exercises');

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      error: {
        code: 'UNAUTHORIZED',
      },
    });
    expect(res.body.error.message).toBeDefined();
  });
});

// ─── 500 error format ─────────────────────────────────────────────────────────

describe('500 error response format', () => {
  /**
   * Validates: Requirements 10.1, 10.5 — 500 errors use { error: { code, message } }
   * and do NOT expose stack traces or internal details.
   */
  let testApp;

  beforeAll(() => {
    // Build a minimal Express app that reuses the real errorHandler middleware
    // and adds a route that throws an unexpected error
    const errorHandler = require('../../src/middleware/errorHandler');

    testApp = express();
    testApp.use(express.json());

    // Route that throws an unexpected (non-AppError) error
    testApp.get('/test-500', () => {
      throw new Error('Something went terribly wrong internally');
    });

    testApp.use(errorHandler);
  });

  it('returns status 500', async () => {
    const res = await request(testApp).get('/test-500');

    expect(res.status).toBe(500);
  });

  it('returns { error: { code, message } } format', async () => {
    const res = await request(testApp).get('/test-500');

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code');
    expect(res.body.error).toHaveProperty('message');
  });

  it('does not expose stack trace or internal error message', async () => {
    const res = await request(testApp).get('/test-500');

    expect(res.status).toBe(500);

    const body = JSON.stringify(res.body);

    // Must not contain the raw internal error message
    expect(body).not.toContain('Something went terribly wrong internally');

    // Must not contain stack trace indicators
    expect(body).not.toContain('at Object.');
    expect(body).not.toContain('.js:');
  });

  it('returns INTERNAL_SERVER_ERROR code for unknown errors', async () => {
    const res = await request(testApp).get('/test-500');

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_SERVER_ERROR');
  });

  it('returns an empty details array (no internal details leaked)', async () => {
    const res = await request(testApp).get('/test-500');

    expect(res.status).toBe(500);
    expect(Array.isArray(res.body.error.details)).toBe(true);
    expect(res.body.error.details).toHaveLength(0);
  });
});
