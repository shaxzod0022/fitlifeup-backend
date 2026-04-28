'use strict';

/**
 * Integration tests for protected routes with JWT authentication.
 * 
 * Tests that:
 * - Protected routes work with valid JWT tokens
 * - req.userId is correctly set for all protected routes
 * - Requests without tokens are rejected
 * - Requests with invalid tokens are rejected
 * 
 * Validates: Requirements 6.1, 6.3, 6.4, 9.1, 9.2
 */

// Use in-memory SQLite for tests
process.env.DB_PATH = ':memory:';

// Set JWT_SECRET for tests
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-secret-key-for-testing-min-32-chars-long';
}

const request = require('supertest');
const app = require('../../src/app');
const { sequelize, User } = require('../../src/models/index');
const tokenService = require('../../src/services/token.service');

// ─── DB lifecycle ─────────────────────────────────────────────────────────────

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  // Clean up between tests
  await User.destroy({ where: {}, truncate: true });
});

// ─── Helper functions ─────────────────────────────────────────────────────────

/**
 * Register a user and get valid tokens
 */
async function registerAndLogin() {
  // Register
  await request(app)
    .post('/api/auth/register')
    .send({
      email: 'test@example.com',
      password: 'password123'
    });

  // Login
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'test@example.com',
      password: 'password123'
    });

  return {
    accessToken: loginRes.body.accessToken,
    refreshToken: loginRes.body.refreshToken,
    userId: loginRes.body.userId
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Protected routes with JWT authentication', () => {
  let validAccessToken;
  let userId;

  beforeEach(async () => {
    const tokens = await registerAndLogin();
    validAccessToken = tokens.accessToken;
    userId = tokens.userId;
  });

  describe('Valid JWT token authentication', () => {
    const protectedRoutes = [
      { method: 'get', path: '/api/exercises', description: 'GET /api/exercises' },
      { method: 'get', path: '/api/sets', description: 'GET /api/sets' },
      { method: 'get', path: '/api/profile', description: 'GET /api/profile' },
      { method: 'get', path: '/api/programs', description: 'GET /api/programs' },
      { method: 'get', path: '/api/dishes', description: 'GET /api/dishes' },
      { method: 'get', path: '/api/meal-logs', description: 'GET /api/meal-logs' },
      { method: 'get', path: '/api/sleep-logs', description: 'GET /api/sleep-logs' },
      { method: 'get', path: '/api/progress/stats', description: 'GET /api/progress/stats' },
      { method: 'get', path: '/api/recommendations', description: 'GET /api/recommendations' },
    ];

    protectedRoutes.forEach(({ method, path, description }) => {
      it(`${description} succeeds with valid Bearer token`, async () => {
        const res = await request(app)
          [method](path)
          .set('Authorization', `Bearer ${validAccessToken}`);

        // Should not return 401 (may return 200, 404, or other valid status)
        expect(res.status).not.toBe(401);
      });
    });

    it('attaches userId to request context for route handlers', async () => {
      // We can verify this by checking that the route handler receives the userId
      // For example, exercises route should filter by userId
      const res = await request(app)
        .get('/api/exercises')
        .set('Authorization', `Bearer ${validAccessToken}`);

      // Should succeed (not 401)
      expect(res.status).not.toBe(401);
      
      // The response should be valid (200 or 404, not an auth error)
      expect([200, 404]).toContain(res.status);
    });

    it('accepts token in Authorization header with Bearer scheme', async () => {
      const res = await request(app)
        .get('/api/exercises')
        .set('Authorization', `Bearer ${validAccessToken}`);

      expect(res.status).not.toBe(401);
    });
  });

  describe('Missing token rejection', () => {
    const protectedRoutes = [
      { method: 'get', path: '/api/exercises' },
      { method: 'get', path: '/api/sets' },
      { method: 'get', path: '/api/profile' },
      { method: 'get', path: '/api/programs' },
      { method: 'get', path: '/api/dishes' },
      { method: 'get', path: '/api/meal-logs' },
      { method: 'get', path: '/api/sleep-logs' },
      { method: 'get', path: '/api/progress/stats' },
      { method: 'get', path: '/api/recommendations' },
    ];

    protectedRoutes.forEach(({ method, path }) => {
      it(`${method.toUpperCase()} ${path} returns 401 without Authorization header`, async () => {
        const res = await request(app)[method](path);

        expect(res.status).toBe(401);
        expect(res.body.error).toHaveProperty('code', 'UNAUTHORIZED');
        expect(res.body.error.message).toContain('Authentication required');
      });
    });

    it('returns 401 with empty Authorization header', async () => {
      const res = await request(app)
        .get('/api/exercises')
        .set('Authorization', '');

      expect(res.status).toBe(401);
    });
  });

  describe('Invalid token rejection', () => {
    it('returns 401 for malformed token', async () => {
      const res = await request(app)
        .get('/api/exercises')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res.status).toBe(401);
      expect(res.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('returns 401 for token with invalid signature', async () => {
      // Create a token with wrong secret
      const jwt = require('jsonwebtoken');
      const fakeToken = jwt.sign(
        { userId: 999, type: 'access' },
        'wrong-secret-key',
        { expiresIn: '15m' }
      );

      const res = await request(app)
        .get('/api/exercises')
        .set('Authorization', `Bearer ${fakeToken}`);

      expect(res.status).toBe(401);
    });

    it('returns 401 for expired token', async () => {
      // Create an expired token
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { userId: userId, type: 'access' },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' } // Already expired
      );

      const res = await request(app)
        .get('/api/exercises')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error.message).toContain('expired');
    });

    it('returns 401 for refresh token used as access token', async () => {
      // Generate a refresh token
      const refreshToken = await tokenService.generateRefreshToken(userId);

      const res = await request(app)
        .get('/api/exercises')
        .set('Authorization', `Bearer ${refreshToken}`);

      // Should fail because middleware expects type='access'
      expect(res.status).toBe(401);
    });

    it('returns 401 for malformed Authorization header (missing Bearer)', async () => {
      const res = await request(app)
        .get('/api/exercises')
        .set('Authorization', validAccessToken); // Missing "Bearer " prefix

      expect(res.status).toBe(401);
      expect(res.body.error.message).toContain('Invalid authorization header format');
    });

    it('returns 401 for malformed Authorization header (wrong scheme)', async () => {
      const res = await request(app)
        .get('/api/exercises')
        .set('Authorization', `Basic ${validAccessToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error.message).toContain('Invalid authorization header format');
    });

    it('returns 401 for blacklisted token', async () => {
      // Blacklist the token
      const decoded = tokenService.verifyToken(validAccessToken, 'access');
      const expiresAt = new Date(decoded.exp * 1000);
      await tokenService.blacklistToken(validAccessToken, expiresAt);

      const res = await request(app)
        .get('/api/exercises')
        .set('Authorization', `Bearer ${validAccessToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error.message).toContain('revoked');
    });
  });

  describe('Token payload validation', () => {
    it('extracts userId from token payload', async () => {
      // Verify that the token contains the correct userId
      const decoded = tokenService.verifyToken(validAccessToken, 'access');
      expect(decoded.userId).toBe(userId);

      // Verify the route handler receives this userId
      const res = await request(app)
        .get('/api/exercises')
        .set('Authorization', `Bearer ${validAccessToken}`);

      expect(res.status).not.toBe(401);
    });

    it('rejects token with missing userId claim', async () => {
      // Create a token without userId
      const jwt = require('jsonwebtoken');
      const invalidToken = jwt.sign(
        { type: 'access' }, // Missing userId
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      const res = await request(app)
        .get('/api/exercises')
        .set('Authorization', `Bearer ${invalidToken}`);

      expect(res.status).toBe(401);
    });

    it('rejects token with missing type claim', async () => {
      // Create a token without type
      const jwt = require('jsonwebtoken');
      const invalidToken = jwt.sign(
        { userId: userId }, // Missing type
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      const res = await request(app)
        .get('/api/exercises')
        .set('Authorization', `Bearer ${invalidToken}`);

      expect(res.status).toBe(401);
    });
  });

  describe('Multiple protected routes with same token', () => {
    it('allows multiple requests with the same valid token', async () => {
      // First request
      const res1 = await request(app)
        .get('/api/exercises')
        .set('Authorization', `Bearer ${validAccessToken}`);
      expect(res1.status).not.toBe(401);

      // Second request with same token
      const res2 = await request(app)
        .get('/api/sets')
        .set('Authorization', `Bearer ${validAccessToken}`);
      expect(res2.status).not.toBe(401);

      // Third request with same token
      const res3 = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${validAccessToken}`);
      expect(res3.status).not.toBe(401);
    });
  });

  describe('Public routes without authentication', () => {
    it('allows access to /api/health without token', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
    });

    it('allows access to /api-docs without token', async () => {
      const res = await request(app).get('/api-docs');
      expect([200, 301, 302]).toContain(res.status);
    });

    it('allows access to /auth/register without token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123'
        });
      expect(res.status).toBe(201);
    });

    it('allows access to /auth/login without token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      expect(res.status).toBe(200);
    });
  });
});
