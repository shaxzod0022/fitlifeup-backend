'use strict';

// Load environment variables before importing modules
require('dotenv').config();

/**
 * Unit Tests for Token Service
 * 
 * Tests specific examples and edge cases for JWT token generation,
 * verification, blacklisting, and storage.
 */

const { Sequelize } = require('sequelize');
const tokenService = require('../../../src/services/token.service');
const { RefreshToken, initRefreshToken } = require('../../../src/models/RefreshToken');
const { BlacklistedToken, initBlacklistedToken } = require('../../../src/models/BlacklistedToken');
const { User, initUser } = require('../../../src/models/User');
const { UnauthorizedError } = require('../../../src/utils/errors');
const jwt = require('jsonwebtoken');

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

describe('Token Service - generateAccessToken', () => {
  test('should generate a valid access token', () => {
    const userId = 123;
    const token = tokenService.generateAccessToken(userId);
    
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3); // JWT has 3 parts
  });

  test('should generate different tokens for same userId', async () => {
    const userId = 123;
    const token1 = tokenService.generateAccessToken(userId);
    
    // Wait 1 second to ensure different iat timestamp (iat is in seconds)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const token2 = tokenService.generateAccessToken(userId);
    
    expect(token1).not.toBe(token2); // Different iat timestamps
  });

  test('should include userId in token payload', () => {
    const userId = 456;
    const token = tokenService.generateAccessToken(userId);
    const decoded = tokenService.verifyToken(token, 'access');
    
    expect(decoded.userId).toBe(userId);
  });
});

describe('Token Service - generateRefreshToken', () => {
  let testUser;

  beforeEach(async () => {
    // Create a test user for foreign key constraint
    testUser = await User.create({
      email: 'test@example.com',
      passwordHash: 'hashedpassword123'
    });
  });

  test('should generate a valid refresh token', async () => {
    const token = await tokenService.generateRefreshToken(testUser.id);
    
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3); // JWT has 3 parts
  });

  test('should store refresh token in database', async () => {
    const token = await tokenService.generateRefreshToken(testUser.id);
    
    const record = await RefreshToken.findOne({ where: { token } });
    expect(record).not.toBeNull();
    expect(record.userId).toBe(testUser.id);
  });

  test('should generate different tokens for same userId', async () => {
    const token1 = await tokenService.generateRefreshToken(testUser.id);
    
    // Wait 1 second to ensure different iat timestamp (iat is in seconds)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const token2 = await tokenService.generateRefreshToken(testUser.id);
    
    expect(token1).not.toBe(token2); // Different iat timestamps
  });
});

describe('Token Service - verifyToken', () => {
  let testUser;

  beforeEach(async () => {
    // Create a test user for foreign key constraint
    testUser = await User.create({
      email: 'test@example.com',
      passwordHash: 'hashedpassword123'
    });
  });

  test('should verify valid access token', () => {
    const token = tokenService.generateAccessToken(testUser.id);
    
    const decoded = tokenService.verifyToken(token, 'access');
    
    expect(decoded.userId).toBe(testUser.id);
    expect(decoded.type).toBe('access');
  });

  test('should verify valid refresh token', async () => {
    const token = await tokenService.generateRefreshToken(testUser.id);
    
    const decoded = tokenService.verifyToken(token, 'refresh');
    
    expect(decoded.userId).toBe(testUser.id);
    expect(decoded.type).toBe('refresh');
  });

  test('should throw UnauthorizedError for invalid signature', () => {
    const userId = 123;
    const token = tokenService.generateAccessToken(userId);
    
    // Tamper with the token
    const parts = token.split('.');
    parts[2] = 'tampered-signature';
    const tamperedToken = parts.join('.');
    
    expect(() => {
      tokenService.verifyToken(tamperedToken, 'access');
    }).toThrow(UnauthorizedError);
  });

  test('should throw UnauthorizedError for expired token', () => {
    const userId = 123;
    
    // Create an expired token (expired 1 hour ago)
    const expiredToken = jwt.sign(
      { userId, type: 'access' },
      process.env.JWT_SECRET,
      { expiresIn: '-1h', algorithm: 'HS256' }
    );
    
    expect(() => {
      tokenService.verifyToken(expiredToken, 'access');
    }).toThrow(UnauthorizedError);
    
    expect(() => {
      tokenService.verifyToken(expiredToken, 'access');
    }).toThrow('Token expired');
  });

  test('should throw UnauthorizedError for wrong token type', () => {
    const userId = 123;
    const accessToken = tokenService.generateAccessToken(userId);
    
    expect(() => {
      tokenService.verifyToken(accessToken, 'refresh');
    }).toThrow(UnauthorizedError);
    
    expect(() => {
      tokenService.verifyToken(accessToken, 'refresh');
    }).toThrow('Invalid token type');
  });

  test('should throw UnauthorizedError for malformed token', () => {
    expect(() => {
      tokenService.verifyToken('not-a-valid-jwt', 'access');
    }).toThrow(UnauthorizedError);
  });
});

describe('Token Service - isBlacklisted', () => {
  test('should return false for non-blacklisted token', async () => {
    const token = 'some-token';
    const result = await tokenService.isBlacklisted(token);
    
    expect(result).toBe(false);
  });

  test('should return true for blacklisted token', async () => {
    const token = 'blacklisted-token';
    await BlacklistedToken.create({
      token,
      blacklistedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600 * 1000)
    });
    
    const result = await tokenService.isBlacklisted(token);
    
    expect(result).toBe(true);
  });
});

describe('Token Service - blacklistToken', () => {
  test('should add token to blacklist', async () => {
    const token = 'token-to-blacklist';
    const expiresAt = new Date(Date.now() + 3600 * 1000);
    
    await tokenService.blacklistToken(token, expiresAt);
    
    const record = await BlacklistedToken.findOne({ where: { token } });
    expect(record).not.toBeNull();
    expect(record.token).toBe(token);
    expect(record.blacklistedAt).toBeInstanceOf(Date);
    expect(record.expiresAt.getTime()).toBe(expiresAt.getTime());
  });

  test('should record blacklistedAt timestamp', async () => {
    const token = 'token-to-blacklist';
    const expiresAt = new Date(Date.now() + 3600 * 1000);
    const beforeBlacklist = Date.now();
    
    await tokenService.blacklistToken(token, expiresAt);
    
    const afterBlacklist = Date.now();
    const record = await BlacklistedToken.findOne({ where: { token } });
    
    expect(record.blacklistedAt.getTime()).toBeGreaterThanOrEqual(beforeBlacklist);
    expect(record.blacklistedAt.getTime()).toBeLessThanOrEqual(afterBlacklist);
  });
});

describe('Token Service - storeRefreshToken', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await User.create({
      email: 'test@example.com',
      passwordHash: 'hashedpassword123'
    });
  });

  test('should store refresh token in database', async () => {
    const token = 'refresh-token';
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    
    await tokenService.storeRefreshToken(testUser.id, token, expiresAt);
    
    const record = await RefreshToken.findOne({ where: { token } });
    expect(record).not.toBeNull();
    expect(record.userId).toBe(testUser.id);
    expect(record.token).toBe(token);
    expect(record.expiresAt.getTime()).toBe(expiresAt.getTime());
  });
});

describe('Token Service - verifyRefreshTokenExists', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await User.create({
      email: 'test@example.com',
      passwordHash: 'hashedpassword123'
    });
  });

  test('should return true for existing refresh token', async () => {
    const token = await tokenService.generateRefreshToken(testUser.id);
    
    const exists = await tokenService.verifyRefreshTokenExists(token);
    
    expect(exists).toBe(true);
  });

  test('should return false for non-existing refresh token', async () => {
    const exists = await tokenService.verifyRefreshTokenExists('non-existing-token');
    
    expect(exists).toBe(false);
  });
});

describe('Token Service - cleanupExpiredTokens', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await User.create({
      email: 'test@example.com',
      passwordHash: 'hashedpassword123'
    });
  });

  test('should remove expired refresh tokens', async () => {
    // Create expired token
    const expiredToken = await RefreshToken.create({
      userId: testUser.id,
      token: 'expired-token',
      expiresAt: new Date(Date.now() - 3600 * 1000) // 1 hour ago
    });
    
    // Create valid token
    const validToken = await RefreshToken.create({
      userId: testUser.id,
      token: 'valid-token',
      expiresAt: new Date(Date.now() + 3600 * 1000) // 1 hour from now
    });
    
    const result = await tokenService.cleanupExpiredTokens();
    
    expect(result.refreshTokensDeleted).toBe(1);
    
    // Verify expired token is gone
    const expiredRecord = await RefreshToken.findOne({ where: { token: 'expired-token' } });
    expect(expiredRecord).toBeNull();
    
    // Verify valid token still exists
    const validRecord = await RefreshToken.findOne({ where: { token: 'valid-token' } });
    expect(validRecord).not.toBeNull();
  });

  test('should remove expired blacklisted tokens', async () => {
    // Create expired blacklisted token
    await BlacklistedToken.create({
      token: 'expired-blacklisted',
      blacklistedAt: new Date(),
      expiresAt: new Date(Date.now() - 3600 * 1000) // 1 hour ago
    });
    
    // Create valid blacklisted token
    await BlacklistedToken.create({
      token: 'valid-blacklisted',
      blacklistedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600 * 1000) // 1 hour from now
    });
    
    const result = await tokenService.cleanupExpiredTokens();
    
    expect(result.blacklistedTokensDeleted).toBe(1);
    
    // Verify expired token is gone
    const expiredRecord = await BlacklistedToken.findOne({ where: { token: 'expired-blacklisted' } });
    expect(expiredRecord).toBeNull();
    
    // Verify valid token still exists
    const validRecord = await BlacklistedToken.findOne({ where: { token: 'valid-blacklisted' } });
    expect(validRecord).not.toBeNull();
  });

  test('should return counts of deleted tokens', async () => {
    const user1 = await User.create({
      email: 'user1@example.com',
      passwordHash: 'hash1'
    });
    const user2 = await User.create({
      email: 'user2@example.com',
      passwordHash: 'hash2'
    });

    // Create multiple expired tokens
    await RefreshToken.create({
      userId: user1.id,
      token: 'expired-1',
      expiresAt: new Date(Date.now() - 3600 * 1000)
    });
    
    await RefreshToken.create({
      userId: user2.id,
      token: 'expired-2',
      expiresAt: new Date(Date.now() - 3600 * 1000)
    });
    
    await BlacklistedToken.create({
      token: 'expired-blacklisted-1',
      blacklistedAt: new Date(),
      expiresAt: new Date(Date.now() - 3600 * 1000)
    });
    
    const result = await tokenService.cleanupExpiredTokens();
    
    expect(result.refreshTokensDeleted).toBe(2);
    expect(result.blacklistedTokensDeleted).toBe(1);
  });

  test('should not remove non-expired tokens', async () => {
    const user = await User.create({
      email: 'user@example.com',
      passwordHash: 'hash'
    });

    // Create only valid tokens
    await RefreshToken.create({
      userId: user.id,
      token: 'valid-token',
      expiresAt: new Date(Date.now() + 3600 * 1000)
    });
    
    await BlacklistedToken.create({
      token: 'valid-blacklisted',
      blacklistedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600 * 1000)
    });
    
    const result = await tokenService.cleanupExpiredTokens();
    
    expect(result.refreshTokensDeleted).toBe(0);
    expect(result.blacklistedTokensDeleted).toBe(0);
    
    // Verify tokens still exist
    const refreshCount = await RefreshToken.count();
    const blacklistedCount = await BlacklistedToken.count();
    
    expect(refreshCount).toBe(1);
    expect(blacklistedCount).toBe(1);
  });
});

describe('Token Service - Database Storage and Retrieval', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await User.create({
      email: 'test@example.com',
      passwordHash: 'hashedpassword123'
    });
  });

  test('should handle multiple refresh tokens for same user', async () => {
    const token1 = await tokenService.generateRefreshToken(testUser.id);
    const token2 = await tokenService.generateRefreshToken(testUser.id);
    
    const count = await RefreshToken.count({ where: { userId: testUser.id } });
    expect(count).toBe(2);
    
    const exists1 = await tokenService.verifyRefreshTokenExists(token1);
    const exists2 = await tokenService.verifyRefreshTokenExists(token2);
    
    expect(exists1).toBe(true);
    expect(exists2).toBe(true);
  });

  test('should handle blacklisting multiple tokens', async () => {
    const token1 = 'token-1';
    const token2 = 'token-2';
    const expiresAt = new Date(Date.now() + 3600 * 1000);
    
    await tokenService.blacklistToken(token1, expiresAt);
    await tokenService.blacklistToken(token2, expiresAt);
    
    const isBlacklisted1 = await tokenService.isBlacklisted(token1);
    const isBlacklisted2 = await tokenService.isBlacklisted(token2);
    
    expect(isBlacklisted1).toBe(true);
    expect(isBlacklisted2).toBe(true);
  });
});

describe('Token Service - Performance', () => {
  test('blacklist checking should be fast', async () => {
    const token = 'test-token';
    
    const startTime = Date.now();
    await tokenService.isBlacklisted(token);
    const endTime = Date.now();
    
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(100); // Should complete in less than 100ms
  });

  test('token verification should be fast', () => {
    const userId = 123;
    const token = tokenService.generateAccessToken(userId);
    
    const startTime = Date.now();
    tokenService.verifyToken(token, 'access');
    const endTime = Date.now();
    
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(50); // Should complete in less than 50ms
  });
});
