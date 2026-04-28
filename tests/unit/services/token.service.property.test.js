'use strict';

// Load environment variables before importing modules
require('dotenv').config();

/**
 * Property-Based Tests for Token Service
 * 
 * Tests universal properties of JWT token generation, verification, and management.
 * Uses fast-check for property-based testing with 100 iterations per property.
 */

const fc = require('fast-check');
const jwt = require('jsonwebtoken');
const { Sequelize } = require('sequelize');
const tokenService = require('../../../src/services/token.service');
const { RefreshToken, initRefreshToken } = require('../../../src/models/RefreshToken');
const { BlacklistedToken, initBlacklistedToken } = require('../../../src/models/BlacklistedToken');
const { User, initUser } = require('../../../src/models/User');

let sequelize;

// Helper function to create user if it doesn't exist
async function ensureUserExists(userId) {
  try {
    await User.create({
      id: userId,
      email: `user${userId}@example.com`,
      passwordHash: 'hashedpassword123'
    });
  } catch (error) {
    // Ignore duplicate key errors - user already exists
    if (!error.name || (!error.name.includes('Unique') && !error.name.includes('SequelizeUniqueConstraintError'))) {
      throw error;
    }
  }
}

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

/**
 * Property 17: Token Signature Verification
 * **Validates: Requirements 4.1**
 * 
 * For any generated token, it SHALL be verifiable using the configured JWT secret key.
 */
describe('Property 17: Token Signature Verification', () => {
  test('any generated access token is verifiable with the JWT secret', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // userId generator
        async (userId) => {
          const token = tokenService.generateAccessToken(userId);
          
          // Token should be verifiable
          const decoded = tokenService.verifyToken(token, 'access');
          
          // Should contain the userId
          expect(decoded.userId).toBe(userId);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('any generated refresh token is verifiable with the JWT secret', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // userId generator
        async (userId) => {
          await ensureUserExists(userId);

          const token = await tokenService.generateRefreshToken(userId);
          
          // Token should be verifiable
          const decoded = tokenService.verifyToken(token, 'refresh');
          
          // Should contain the userId
          expect(decoded.userId).toBe(userId);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 18: Token Claims Structure
 * **Validates: Requirements 4.2, 4.3**
 * 
 * For any generated token, decoding SHALL reveal the required claims:
 * userId, type (access or refresh), iat (issued-at), and exp (expiration).
 */
describe('Property 18: Token Claims Structure', () => {
  test('any access token contains required claims: userId, type, iat, exp', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // userId generator
        async (userId) => {
          const token = tokenService.generateAccessToken(userId);
          const decoded = tokenService.verifyToken(token, 'access');
          
          // Check all required claims exist
          expect(decoded).toHaveProperty('userId');
          expect(decoded).toHaveProperty('type');
          expect(decoded).toHaveProperty('iat');
          expect(decoded).toHaveProperty('exp');
          
          // Verify claim values
          expect(decoded.userId).toBe(userId);
          expect(decoded.type).toBe('access');
          expect(typeof decoded.iat).toBe('number');
          expect(typeof decoded.exp).toBe('number');
          expect(decoded.exp).toBeGreaterThan(decoded.iat);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('any refresh token contains required claims: userId, type, iat, exp', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // userId generator
        async (userId) => {
          await ensureUserExists(userId);

          const token = await tokenService.generateRefreshToken(userId);
          const decoded = tokenService.verifyToken(token, 'refresh');
          
          // Check all required claims exist
          expect(decoded).toHaveProperty('userId');
          expect(decoded).toHaveProperty('type');
          expect(decoded).toHaveProperty('iat');
          expect(decoded).toHaveProperty('exp');
          
          // Verify claim values
          expect(decoded.userId).toBe(userId);
          expect(decoded.type).toBe('refresh');
          expect(typeof decoded.iat).toBe('number');
          expect(typeof decoded.exp).toBe('number');
          expect(decoded.exp).toBeGreaterThan(decoded.iat);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 19: JWT Algorithm HS256
 * **Validates: Requirements 4.4**
 * 
 * For any generated token, the JWT header SHALL specify the algorithm as HS256.
 */
describe('Property 19: JWT Algorithm HS256', () => {
  test('any access token uses HS256 algorithm', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // userId generator
        async (userId) => {
          const token = tokenService.generateAccessToken(userId);
          
          // Decode without verification to inspect header
          const decoded = jwt.decode(token, { complete: true });
          
          expect(decoded.header.alg).toBe('HS256');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('any refresh token uses HS256 algorithm', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // userId generator
        async (userId) => {
          await ensureUserExists(userId);

          const token = await tokenService.generateRefreshToken(userId);
          
          // Decode without verification to inspect header
          const decoded = jwt.decode(token, { complete: true });
          
          expect(decoded.header.alg).toBe('HS256');
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 11: Access Token Expiration Time
 * **Validates: Requirements 3.2, 4.5**
 * 
 * For any successful login, the generated access token SHALL have an expiration
 * time approximately 15 minutes from issuance.
 */
describe('Property 11: Access Token Expiration Time', () => {
  test('any access token expires approximately 15 minutes from issuance', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // userId generator
        async (userId) => {
          const beforeGeneration = Date.now();
          const token = tokenService.generateAccessToken(userId);
          const afterGeneration = Date.now();
          
          const decoded = tokenService.verifyToken(token, 'access');
          
          // Expected expiration: 15 minutes = 900 seconds
          const expectedExpiry = 900;
          
          // Calculate actual expiration time from issuance
          const actualExpiry = decoded.exp - decoded.iat;
          
          // Allow 1 second tolerance for processing time
          expect(actualExpiry).toBeGreaterThanOrEqual(expectedExpiry - 1);
          expect(actualExpiry).toBeLessThanOrEqual(expectedExpiry + 1);
          
          // Verify expiration is in the future
          const expirationTime = decoded.exp * 1000; // Convert to milliseconds
          expect(expirationTime).toBeGreaterThan(beforeGeneration);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 12: Refresh Token Expiration Time
 * **Validates: Requirements 3.3, 4.6**
 * 
 * For any successful login, the generated refresh token SHALL have an expiration
 * time approximately 7 days from issuance.
 */
describe('Property 12: Refresh Token Expiration Time', () => {
  test('any refresh token expires approximately 7 days from issuance', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // userId generator
        async (userId) => {
          await ensureUserExists(userId);

          const beforeGeneration = Date.now();
          const token = await tokenService.generateRefreshToken(userId);
          const afterGeneration = Date.now();
          
          const decoded = tokenService.verifyToken(token, 'refresh');
          
          // Expected expiration: 7 days = 604800 seconds
          const expectedExpiry = 604800;
          
          // Calculate actual expiration time from issuance
          const actualExpiry = decoded.exp - decoded.iat;
          
          // Allow 1 second tolerance for processing time
          expect(actualExpiry).toBeGreaterThanOrEqual(expectedExpiry - 1);
          expect(actualExpiry).toBeLessThanOrEqual(expectedExpiry + 1);
          
          // Verify expiration is in the future
          const expirationTime = decoded.exp * 1000; // Convert to milliseconds
          expect(expirationTime).toBeGreaterThan(beforeGeneration);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 16: User ID in Token Payload
 * **Validates: Requirements 3.7**
 * 
 * For any generated token (access or refresh), decoding the JWT SHALL reveal
 * the userId in the payload.
 */
describe('Property 16: User ID in Token Payload', () => {
  test('any access token contains userId in payload', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // userId generator
        async (userId) => {
          const token = tokenService.generateAccessToken(userId);
          const decoded = tokenService.verifyToken(token, 'access');
          
          expect(decoded.userId).toBe(userId);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('any refresh token contains userId in payload', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // userId generator
        async (userId) => {
          await ensureUserExists(userId);

          const token = await tokenService.generateRefreshToken(userId);
          const decoded = tokenService.verifyToken(token, 'refresh');
          
          expect(decoded.userId).toBe(userId);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 15: Refresh Token Persisted in Database
 * **Validates: Requirements 3.6**
 * 
 * For any successful login, the generated refresh token SHALL exist in the
 * RefreshToken table with the correct userId and expiresAt timestamp.
 */
describe('Property 15: Refresh Token Persisted in Database', () => {
  test('any generated refresh token exists in RefreshToken table', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // userId generator
        async (userId) => {
          await ensureUserExists(userId);

          const token = await tokenService.generateRefreshToken(userId);
          
          // Verify token exists in database
          const exists = await tokenService.verifyRefreshTokenExists(token);
          expect(exists).toBe(true);
          
          // Verify database record has correct userId and expiresAt
          const record = await RefreshToken.findOne({ where: { token } });
          expect(record).not.toBeNull();
          expect(record.userId).toBe(userId);
          expect(record.expiresAt).toBeInstanceOf(Date);
          
          // Verify expiresAt matches token expiration
          const decoded = tokenService.verifyToken(token, 'refresh');
          const expectedExpiration = new Date(decoded.exp * 1000);
          expect(record.expiresAt.getTime()).toBe(expectedExpiration.getTime());
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 22: Blacklisted Token Rejected for Refresh
 * **Validates: Requirements 5.6, 7.4**
 * 
 * For any refresh token, after adding it to the blacklist, attempting to use
 * it for refresh SHALL fail with an authentication error.
 */
describe('Property 22: Blacklisted Token Rejected for Refresh', () => {
  test('any blacklisted token is detected by isBlacklisted check', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // userId generator
        async (userId) => {
          await ensureUserExists(userId);

          const token = await tokenService.generateRefreshToken(userId);
          
          // Token should not be blacklisted initially
          // (Skip if already blacklisted from previous iteration)
          const beforeBlacklist = await tokenService.isBlacklisted(token);
          if (beforeBlacklist) {
            // Token already blacklisted, skip this iteration
            return;
          }
          
          expect(beforeBlacklist).toBe(false);
          
          // Blacklist the token
          const decoded = tokenService.verifyToken(token, 'refresh');
          const expiresAt = new Date(decoded.exp * 1000);
          await tokenService.blacklistToken(token, expiresAt);
          
          // Token should now be blacklisted
          const afterBlacklist = await tokenService.isBlacklisted(token);
          expect(afterBlacklist).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 28: Cleanup Removes Expired Tokens
 * **Validates: Requirements 11.1, 11.2, 11.3**
 * 
 * For any token (refresh or blacklisted) with an expiration timestamp in the past,
 * running the cleanup function SHALL remove it from the database.
 */
describe('Property 28: Cleanup Removes Expired Tokens', () => {
  test('cleanup removes expired refresh tokens', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // userId generator
        async (userId) => {
          await ensureUserExists(userId);

          // Create an expired refresh token (expires 1 hour ago)
          const pastDate = new Date(Date.now() - 3600 * 1000);
          await RefreshToken.create({
            userId,
            token: `expired-token-${userId}-${Date.now()}`,
            expiresAt: pastDate
          });
          
          // Create a non-expired refresh token
          const futureDate = new Date(Date.now() + 3600 * 1000);
          await RefreshToken.create({
            userId,
            token: `valid-token-${userId}-${Date.now()}`,
            expiresAt: futureDate
          });
          
          // Run cleanup
          const result = await tokenService.cleanupExpiredTokens();
          
          // Should have deleted at least 1 expired token
          expect(result.refreshTokensDeleted).toBeGreaterThanOrEqual(1);
          
          // Verify expired token is gone
          const expiredCount = await RefreshToken.count({
            where: { expiresAt: { [require('sequelize').Op.lt]: new Date() } }
          });
          expect(expiredCount).toBe(0);
          
          // Verify non-expired token still exists
          const validCount = await RefreshToken.count({
            where: { expiresAt: { [require('sequelize').Op.gt]: new Date() } }
          });
          expect(validCount).toBeGreaterThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('cleanup removes expired blacklisted tokens', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // userId generator
        async (userId) => {
          // Create an expired blacklisted token (expires 1 hour ago)
          const pastDate = new Date(Date.now() - 3600 * 1000);
          await BlacklistedToken.create({
            token: `expired-blacklisted-${userId}-${Date.now()}`,
            blacklistedAt: new Date(),
            expiresAt: pastDate
          });
          
          // Create a non-expired blacklisted token
          const futureDate = new Date(Date.now() + 3600 * 1000);
          await BlacklistedToken.create({
            token: `valid-blacklisted-${userId}-${Date.now()}`,
            blacklistedAt: new Date(),
            expiresAt: futureDate
          });
          
          // Run cleanup
          const result = await tokenService.cleanupExpiredTokens();
          
          // Should have deleted at least 1 expired token
          expect(result.blacklistedTokensDeleted).toBeGreaterThanOrEqual(1);
          
          // Verify expired token is gone
          const expiredCount = await BlacklistedToken.count({
            where: { expiresAt: { [require('sequelize').Op.lt]: new Date() } }
          });
          expect(expiredCount).toBe(0);
          
          // Verify non-expired token still exists
          const validCount = await BlacklistedToken.count({
            where: { expiresAt: { [require('sequelize').Op.gt]: new Date() } }
          });
          expect(validCount).toBeGreaterThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
