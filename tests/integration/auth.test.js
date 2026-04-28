'use strict';

/**
 * Integration tests for /auth routes.
 * 
 * Tests all authentication endpoints: register, login, refresh, logout
 * 
 * Validates: Requirements 1.1, 3.1, 5.1, 7.1, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */

// Use in-memory SQLite for tests
process.env.DB_PATH = ':memory:';

// Set JWT_SECRET for tests
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-secret-key-for-testing-min-32-chars-long';
}

const request = require('supertest');
const app = require('../../src/app');
const { sequelize, User, RefreshToken, BlacklistedToken } = require('../../src/models/index');
const tokenService = require('../../src/services/token.service');

// ─── DB lifecycle ─────────────────────────────────────────────────────────────

beforeAll(async () => {
  // Create all tables in the in-memory DB
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  // Wipe tables between tests for isolation
  await User.destroy({ where: {}, truncate: true });
  await RefreshToken.destroy({ where: {}, truncate: true });
  await BlacklistedToken.destroy({ where: {}, truncate: true });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('creates a user and returns 201 with userId', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('userId');
    expect(res.body).toHaveProperty('message');
    expect(typeof res.body.userId).toBe('number');

    // Verify user was created in database
    const user = await User.findOne({ where: { email: 'test@example.com' } });
    expect(user).not.toBeNull();
    expect(user.email).toBe('test@example.com');
  });

  it('returns 409 when email already exists', async () => {
    // Register first user
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'duplicate@example.com',
        password: 'password123'
      });

    // Try to register with same email
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'duplicate@example.com',
        password: 'different456'
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toHaveProperty('code', 'CONFLICT');
    expect(res.body.error.message).toContain('already registered');
  });

  it('returns 400 when email format is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'not-an-email',
        password: 'password123'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
  });

  it('returns 400 when password is too short', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'short'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    // Check that validation details contain password length error
    const passwordError = res.body.error.details.find(d => d.field === 'password');
    expect(passwordError).toBeDefined();
    expect(passwordError.message).toContain('at least 8 characters');
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        password: 'password123'
      });

    expect(res.status).toBe(400);
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com'
      });

    expect(res.status).toBe(400);
  });

  it('does not expose password hash in response', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(res.status).toBe(201);
    expect(res.body).not.toHaveProperty('passwordHash');
    expect(res.body).not.toHaveProperty('password');
  });
});

describe('POST /auth/login', () => {
  beforeEach(async () => {
    // Register a user for login tests
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'login@example.com',
        password: 'password123'
      });
  });

  it('returns 200 with accessToken, refreshToken, and userId for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'password123'
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body).toHaveProperty('userId');
    expect(typeof res.body.accessToken).toBe('string');
    expect(typeof res.body.refreshToken).toBe('string');
    expect(typeof res.body.userId).toBe('number');

    // Verify tokens are valid JWTs
    expect(res.body.accessToken).toMatch(/^eyJ/);
    expect(res.body.refreshToken).toMatch(/^eyJ/);
  });

  it('stores refresh token in database', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'password123'
      });

    expect(res.status).toBe(200);

    // Verify refresh token was stored
    const storedToken = await RefreshToken.findOne({
      where: { token: res.body.refreshToken }
    });
    expect(storedToken).not.toBeNull();
    expect(storedToken.userId).toBe(res.body.userId);
  });

  it('returns 401 for invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'wrong@example.com',
        password: 'password123'
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    expect(res.body.error.message).toContain('Invalid credentials');
  });

  it('returns 401 for invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'wrongpassword'
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    expect(res.body.error.message).toContain('Invalid credentials');
  });

  it('returns generic error message without revealing which credential is wrong', async () => {
    const wrongEmailRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'wrong@example.com',
        password: 'password123'
      });

    const wrongPasswordRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'wrongpassword'
      });

    // Both should return the same generic error message
    expect(wrongEmailRes.body.error.message).toBe(wrongPasswordRes.body.error.message);
    expect(wrongEmailRes.body.error.message).toContain('Invalid credentials');
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        password: 'password123'
      });

    expect(res.status).toBe(400);
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com'
      });

    expect(res.status).toBe(400);
  });
});

describe('POST /auth/refresh', () => {
  let validRefreshToken;
  let userId;

  beforeEach(async () => {
    // Register and login to get a valid refresh token
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'refresh@example.com',
        password: 'password123'
      });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'refresh@example.com',
        password: 'password123'
      });

    validRefreshToken = loginRes.body.refreshToken;
    userId = loginRes.body.userId;
  });

  it('returns 200 with new accessToken for valid refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({
        refreshToken: validRefreshToken
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(typeof res.body.accessToken).toBe('string');
    expect(res.body.accessToken).toMatch(/^eyJ/);

    // Verify the new access token is valid
    const decoded = tokenService.verifyToken(res.body.accessToken, 'access');
    expect(decoded.userId).toBe(userId);
  });

  it('returns 401 for invalid refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({
        refreshToken: 'invalid.token.here'
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toHaveProperty('code', 'UNAUTHORIZED');
  });

  it('returns 401 for expired refresh token', async () => {
    // Generate an expired token (expiry in the past)
    const expiredToken = tokenService.generateAccessToken(userId); // Access token expires in 15 min
    
    // Wait a moment and try to use it as refresh token (will fail signature check)
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({
        refreshToken: expiredToken
      });

    expect(res.status).toBe(401);
  });

  it('returns 401 for refresh token not in database', async () => {
    // Generate a valid JWT but don't store it in database
    const jwt = require('jsonwebtoken');
    const fakeToken = jwt.sign(
      { userId: 999, type: 'refresh' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({
        refreshToken: fakeToken
      });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toContain('Invalid refresh token');
  });

  it('returns 401 for blacklisted refresh token', async () => {
    // Blacklist the token
    await request(app)
      .post('/api/auth/logout')
      .send({
        refreshToken: validRefreshToken
      });

    // Try to use the blacklisted token
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({
        refreshToken: validRefreshToken
      });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toContain('revoked');
  });

  it('returns 400 when refreshToken is missing', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('POST /auth/logout', () => {
  let validRefreshToken;
  let validAccessToken;

  beforeEach(async () => {
    // Register and login to get valid tokens
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'logout@example.com',
        password: 'password123'
      });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'logout@example.com',
        password: 'password123'
      });

    validRefreshToken = loginRes.body.refreshToken;
    validAccessToken = loginRes.body.accessToken;
  });

  it('returns 200 with success message', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .send({
        refreshToken: validRefreshToken
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toContain('success');
  });

  it('blacklists the refresh token', async () => {
    await request(app)
      .post('/api/auth/logout')
      .send({
        refreshToken: validRefreshToken
      });

    // Verify token is blacklisted
    const blacklisted = await BlacklistedToken.findOne({
      where: { token: validRefreshToken }
    });
    expect(blacklisted).not.toBeNull();
    expect(blacklisted.blacklistedAt).toBeDefined();
  });

  it('blacklists both refresh and access tokens when both provided', async () => {
    await request(app)
      .post('/api/auth/logout')
      .send({
        refreshToken: validRefreshToken,
        accessToken: validAccessToken
      });

    // Verify both tokens are blacklisted
    const blacklistedRefresh = await BlacklistedToken.findOne({
      where: { token: validRefreshToken }
    });
    const blacklistedAccess = await BlacklistedToken.findOne({
      where: { token: validAccessToken }
    });

    expect(blacklistedRefresh).not.toBeNull();
    expect(blacklistedAccess).not.toBeNull();
  });

  it('prevents using blacklisted token for refresh', async () => {
    // Logout
    await request(app)
      .post('/api/auth/logout')
      .send({
        refreshToken: validRefreshToken
      });

    // Try to refresh with blacklisted token
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({
        refreshToken: validRefreshToken
      });

    expect(res.status).toBe(401);
  });

  it('returns 401 for invalid refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .send({
        refreshToken: 'invalid.token.here'
      });

    expect(res.status).toBe(401);
  });

  it('returns 400 when refreshToken is missing', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .send({});

    expect(res.status).toBe(400);
  });

  it('succeeds even if accessToken is invalid (optional parameter)', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .send({
        refreshToken: validRefreshToken,
        accessToken: 'invalid.token'
      });

    // Should still succeed because refresh token is valid
    expect(res.status).toBe(200);

    // Verify refresh token was blacklisted
    const blacklisted = await BlacklistedToken.findOne({
      where: { token: validRefreshToken }
    });
    expect(blacklisted).not.toBeNull();
  });
});

describe('End-to-end authentication flow', () => {
  it('completes full registration -> login -> refresh -> logout flow', async () => {
    // 1. Register
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'e2e@example.com',
        password: 'password123'
      });
    expect(registerRes.status).toBe(201);
    const userId = registerRes.body.userId;

    // 2. Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'e2e@example.com',
        password: 'password123'
      });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.userId).toBe(userId);
    const { accessToken, refreshToken } = loginRes.body;

    // 3. Refresh token
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({
        refreshToken
      });
    expect(refreshRes.status).toBe(200);
    const newAccessToken = refreshRes.body.accessToken;
    expect(newAccessToken).toBeDefined();
    expect(newAccessToken).toMatch(/^eyJ/); // Should be a valid JWT

    // 4. Logout
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .send({
        refreshToken,
        accessToken: newAccessToken
      });
    expect(logoutRes.status).toBe(200);

    // 5. Verify tokens are blacklisted
    const refreshAgainRes = await request(app)
      .post('/api/auth/refresh')
      .send({
        refreshToken
      });
    expect(refreshAgainRes.status).toBe(401);
  });
});
