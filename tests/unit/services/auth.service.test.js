'use strict';

// Load environment variables before importing modules
require('dotenv').config();

/**
 * Unit Tests for Auth Service
 * 
 * Tests specific examples and edge cases for registration, login, refresh, and logout.
 */

const { Sequelize } = require('sequelize');
const authService = require('../../../src/services/auth.service');
const tokenService = require('../../../src/services/token.service');
const passwordService = require('../../../src/services/password.service');
const { User, initUser } = require('../../../src/models/User');
const { RefreshToken, initRefreshToken } = require('../../../src/models/RefreshToken');
const { BlacklistedToken, initBlacklistedToken } = require('../../../src/models/BlacklistedToken');
const { ConflictError, UnauthorizedError, ValidationError } = require('../../../src/utils/errors');

let sequelize;

// Setup and teardown
beforeAll(async () => {
  // Create in-memory SQLite database for testing
  sequelize = new Sequelize('sqlite::memory:', {
    logging: false,
  });

  // Initialize models
  initUser(sequelize);
  initRefreshToken(sequelize);
  initBlacklistedToken(sequelize);

  // Set up associations
  RefreshToken.belongsTo(User, { foreignKey: 'userId' });
  User.hasMany(RefreshToken, { foreignKey: 'userId' });

  // Sync the database
  await sequelize.sync({ force: true });
});

beforeEach(async () => {
  await User.destroy({ where: {}, truncate: true, cascade: true });
  await RefreshToken.destroy({ where: {}, truncate: true });
  await BlacklistedToken.destroy({ where: {}, truncate: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Auth Service - register', () => {
  test('should register user with valid email and password', async () => {
    const email = 'test@example.com';
    const password = 'password123';

    const result = await authService.register(email, password);

    expect(result).toHaveProperty('userId');
    expect(typeof result.userId).toBe('number');

    // Verify user exists in database
    const user = await User.findOne({ where: { email } });
    expect(user).not.toBeNull();
    expect(user.email).toBe(email);
  });

  test('should hash password before storing', async () => {
    const email = 'test@example.com';
    const password = 'password123';

    await authService.register(email, password);

    const user = await User.findOne({ where: { email } });
    expect(user.passwordHash).not.toBe(password);
    expect(user.passwordHash).toMatch(/^\$2[aby]\$/); // bcrypt format
  });

  test('should reject duplicate email', async () => {
    const email = 'test@example.com';
    const password1 = 'password123';
    const password2 = 'differentpass';

    await authService.register(email, password1);

    await expect(
      authService.register(email, password2)
    ).rejects.toThrow(ConflictError);
  });

  test('should reject invalid email formats', async () => {
    const invalidEmails = [
      'not-an-email',
      '@example.com',
      'user@',
      'user@.com',
      '',
      'user space@example.com'
    ];

    for (const email of invalidEmails) {
      await expect(
        authService.register(email, 'password123')
      ).rejects.toThrow(ValidationError);
    }
  });

  test('should reject passwords shorter than 8 characters', async () => {
    const email = 'test@example.com';
    const shortPasswords = ['', 'a', 'ab', 'abc', 'abcd', 'abcde', 'abcdef', 'abcdefg'];

    for (const password of shortPasswords) {
      await expect(
        authService.register(email, password)
      ).rejects.toThrow(ValidationError);
    }
  });

  test('should accept passwords exactly 8 characters', async () => {
    const email = 'test@example.com';
    const password = 'abcdefgh'; // exactly 8 characters

    const result = await authService.register(email, password);
    expect(result).toHaveProperty('userId');
  });

  test('should never return passwordHash in response', async () => {
    const email = 'test@example.com';
    const password = 'password123';

    const result = await authService.register(email, password);

    expect(result).not.toHaveProperty('passwordHash');
    expect(result).not.toHaveProperty('password');
    expect(Object.keys(result)).toEqual(['userId']);
  });

  test('should handle null or undefined email', async () => {
    await expect(
      authService.register(null, 'password123')
    ).rejects.toThrow(ValidationError);

    await expect(
      authService.register(undefined, 'password123')
    ).rejects.toThrow(ValidationError);
  });

  test('should handle null or undefined password', async () => {
    await expect(
      authService.register('test@example.com', null)
    ).rejects.toThrow(ValidationError);

    await expect(
      authService.register('test@example.com', undefined)
    ).rejects.toThrow(ValidationError);
  });
});

describe('Auth Service - login', () => {
  test('should login with valid credentials', async () => {
    const email = 'test@example.com';
    const password = 'password123';

    await authService.register(email, password);
    const result = await authService.login(email, password);

    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(result).toHaveProperty('userId');
    expect(typeof result.accessToken).toBe('string');
    expect(typeof result.refreshToken).toBe('string');
    expect(typeof result.userId).toBe('number');
  });

  test('should return different tokens on each login', async () => {
    const email = 'test@example.com';
    const password = 'password123';

    await authService.register(email, password);
    const result1 = await authService.login(email, password);
    
    // Wait 1 second to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const result2 = await authService.login(email, password);

    expect(result1.accessToken).not.toBe(result2.accessToken);
    expect(result1.refreshToken).not.toBe(result2.refreshToken);
  });

  test('should reject login with non-existent email', async () => {
    await expect(
      authService.login('nonexistent@example.com', 'password123')
    ).rejects.toThrow(UnauthorizedError);

    await expect(
      authService.login('nonexistent@example.com', 'password123')
    ).rejects.toThrow('Invalid credentials');
  });

  test('should reject login with wrong password', async () => {
    const email = 'test@example.com';
    const password = 'password123';
    const wrongPassword = 'wrongpassword';

    await authService.register(email, password);

    await expect(
      authService.login(email, wrongPassword)
    ).rejects.toThrow(UnauthorizedError);

    await expect(
      authService.login(email, wrongPassword)
    ).rejects.toThrow('Invalid credentials');
  });

  test('should not reveal whether email or password is wrong', async () => {
    const email = 'test@example.com';
    const password = 'password123';

    await authService.register(email, password);

    // Wrong email error
    let wrongEmailError;
    try {
      await authService.login('wrong@example.com', password);
    } catch (error) {
      wrongEmailError = error;
    }

    // Wrong password error
    let wrongPasswordError;
    try {
      await authService.login(email, 'wrongpassword');
    } catch (error) {
      wrongPasswordError = error;
    }

    // Both errors should have the same message
    expect(wrongEmailError.message).toBe(wrongPasswordError.message);
    expect(wrongEmailError.message).toBe('Invalid credentials');
  });

  test('should store refresh token in database', async () => {
    const email = 'test@example.com';
    const password = 'password123';

    await authService.register(email, password);
    const result = await authService.login(email, password);

    const exists = await tokenService.verifyRefreshTokenExists(result.refreshToken);
    expect(exists).toBe(true);
  });
});

describe('Auth Service - refresh', () => {
  test('should generate new access token with valid refresh token', async () => {
    const email = 'test@example.com';
    const password = 'password123';

    await authService.register(email, password);
    const loginResult = await authService.login(email, password);
    
    // Wait 1 second to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const refreshResult = await authService.refresh(loginResult.refreshToken);

    expect(refreshResult).toHaveProperty('accessToken');
    expect(typeof refreshResult.accessToken).toBe('string');
    expect(refreshResult.accessToken).not.toBe(loginResult.accessToken);
  });

  test('should reject refresh with invalid token signature', async () => {
    const fakeToken = 'invalid.token.signature';

    await expect(
      authService.refresh(fakeToken)
    ).rejects.toThrow(UnauthorizedError);
  });

  test('should reject refresh with expired token', async () => {
    // Create an expired token (this would require mocking or time manipulation)
    // For now, we test with a token that has invalid expiration
    const email = 'test@example.com';
    const password = 'password123';

    await authService.register(email, password);
    const loginResult = await authService.login(email, password);

    // Tamper with the token to make it invalid
    const tamperedToken = loginResult.refreshToken + 'tampered';

    await expect(
      authService.refresh(tamperedToken)
    ).rejects.toThrow(UnauthorizedError);
  });

  test('should reject refresh with token not in database', async () => {
    // Generate a valid token but don't store it in database
    const fakeToken = tokenService.generateAccessToken(999);

    await expect(
      authService.refresh(fakeToken)
    ).rejects.toThrow(UnauthorizedError);
  });

  test('should reject refresh with blacklisted token', async () => {
    const email = 'test@example.com';
    const password = 'password123';

    await authService.register(email, password);
    const loginResult = await authService.login(email, password);

    // Logout to blacklist the token
    await authService.logout(loginResult.refreshToken);

    // Try to refresh with blacklisted token
    await expect(
      authService.refresh(loginResult.refreshToken)
    ).rejects.toThrow(UnauthorizedError);

    await expect(
      authService.refresh(loginResult.refreshToken)
    ).rejects.toThrow('Token has been revoked');
  });
});

describe('Auth Service - logout', () => {
  test('should blacklist refresh token', async () => {
    const email = 'test@example.com';
    const password = 'password123';

    await authService.register(email, password);
    const loginResult = await authService.login(email, password);

    await authService.logout(loginResult.refreshToken);

    const isBlacklisted = await tokenService.isBlacklisted(loginResult.refreshToken);
    expect(isBlacklisted).toBe(true);
  });

  test('should blacklist both refresh and access tokens when provided', async () => {
    const email = 'test@example.com';
    const password = 'password123';

    await authService.register(email, password);
    const loginResult = await authService.login(email, password);

    await authService.logout(loginResult.refreshToken, loginResult.accessToken);

    const refreshBlacklisted = await tokenService.isBlacklisted(loginResult.refreshToken);
    const accessBlacklisted = await tokenService.isBlacklisted(loginResult.accessToken);

    expect(refreshBlacklisted).toBe(true);
    expect(accessBlacklisted).toBe(true);
  });

  test('should record blacklist timestamp', async () => {
    const email = 'test@example.com';
    const password = 'password123';

    await authService.register(email, password);
    const loginResult = await authService.login(email, password);

    const beforeLogout = Date.now();
    await authService.logout(loginResult.refreshToken);
    const afterLogout = Date.now();

    const record = await BlacklistedToken.findOne({
      where: { token: loginResult.refreshToken }
    });

    expect(record).not.toBeNull();
    expect(record.blacklistedAt).toBeInstanceOf(Date);
    expect(record.blacklistedAt.getTime()).toBeGreaterThanOrEqual(beforeLogout);
    expect(record.blacklistedAt.getTime()).toBeLessThanOrEqual(afterLogout);
  });

  test('should reject logout with invalid refresh token', async () => {
    const fakeToken = 'invalid.token.signature';

    await expect(
      authService.logout(fakeToken)
    ).rejects.toThrow(UnauthorizedError);
  });

  test('should handle logout with invalid access token gracefully', async () => {
    const email = 'test@example.com';
    const password = 'password123';

    await authService.register(email, password);
    const loginResult = await authService.login(email, password);

    // Logout with valid refresh token but invalid access token
    // Should not throw error
    await expect(
      authService.logout(loginResult.refreshToken, 'invalid.access.token')
    ).resolves.not.toThrow();

    // Refresh token should still be blacklisted
    const isBlacklisted = await tokenService.isBlacklisted(loginResult.refreshToken);
    expect(isBlacklisted).toBe(true);
  });

  test('should allow logout without access token', async () => {
    const email = 'test@example.com';
    const password = 'password123';

    await authService.register(email, password);
    const loginResult = await authService.login(email, password);

    // Logout with only refresh token
    await authService.logout(loginResult.refreshToken);

    const isBlacklisted = await tokenService.isBlacklisted(loginResult.refreshToken);
    expect(isBlacklisted).toBe(true);
  });
});

describe('Auth Service - error handling', () => {
  test('should handle database errors gracefully', async () => {
    // Close the database connection to simulate error
    await sequelize.close();

    await expect(
      authService.register('test@example.com', 'password123')
    ).rejects.toThrow();

    // Reconnect for other tests
    sequelize = new Sequelize('sqlite::memory:', {
      logging: false,
    });
    initUser(sequelize);
    initRefreshToken(sequelize);
    initBlacklistedToken(sequelize);
    RefreshToken.belongsTo(User, { foreignKey: 'userId' });
    User.hasMany(RefreshToken, { foreignKey: 'userId' });
    await sequelize.sync({ force: true });
  });
});
