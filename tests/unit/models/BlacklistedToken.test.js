'use strict';

const { Sequelize } = require('sequelize');
const { BlacklistedToken, initBlacklistedToken } = require('../../../src/models/BlacklistedToken');

describe('BlacklistedToken Model', () => {
  let sequelize;

  beforeAll(async () => {
    // Create in-memory SQLite database for testing
    sequelize = new Sequelize('sqlite::memory:', {
      logging: false,
    });

    // Initialize model
    initBlacklistedToken(sequelize);

    // Sync the database
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  afterEach(async () => {
    // Clean up after each test
    await BlacklistedToken.destroy({ where: {}, truncate: true });
  });

  describe('Schema Validation', () => {
    test('should create a blacklisted token with valid fields', async () => {
      const blacklistedAt = new Date();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
      
      const token = await BlacklistedToken.create({
        token: 'sample.jwt.token',
        blacklistedAt,
        expiresAt,
      });

      expect(token.id).toBeDefined();
      expect(token.token).toBe('sample.jwt.token');
      expect(token.blacklistedAt).toEqual(blacklistedAt);
      expect(token.expiresAt).toEqual(expiresAt);
      expect(token.createdAt).toBeDefined();
      expect(token.updatedAt).toBeDefined();
    });

    test('should reject null token', async () => {
      const blacklistedAt = new Date();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      
      await expect(
        BlacklistedToken.create({
          token: null,
          blacklistedAt,
          expiresAt,
        })
      ).rejects.toThrow();
    });

    test('should reject null blacklistedAt', async () => {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      
      await expect(
        BlacklistedToken.create({
          token: 'sample.jwt.token',
          blacklistedAt: null,
          expiresAt,
        })
      ).rejects.toThrow();
    });

    test('should reject null expiresAt', async () => {
      const blacklistedAt = new Date();
      
      await expect(
        BlacklistedToken.create({
          token: 'sample.jwt.token',
          blacklistedAt,
          expiresAt: null,
        })
      ).rejects.toThrow();
    });

    test('should reject duplicate token (unique constraint)', async () => {
      const blacklistedAt = new Date();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      
      await BlacklistedToken.create({
        token: 'duplicate.token',
        blacklistedAt,
        expiresAt,
      });

      await expect(
        BlacklistedToken.create({
          token: 'duplicate.token',
          blacklistedAt,
          expiresAt,
        })
      ).rejects.toThrow();
    });
  });

  describe('Indexes', () => {
    test('should have unique index on token field', async () => {
      const indexes = await sequelize
        .getQueryInterface()
        .showIndex(BlacklistedToken.tableName);

      const tokenIndex = indexes.find((index) =>
        index.fields.some((field) => field.attribute === 'token')
      );

      expect(tokenIndex).toBeDefined();
      expect(tokenIndex.unique).toBe(true);
    });

    test('should have index on expiresAt field', async () => {
      const indexes = await sequelize
        .getQueryInterface()
        .showIndex(BlacklistedToken.tableName);

      const expiresAtIndex = indexes.find((index) =>
        index.fields.some((field) => field.attribute === 'expiresAt')
      );

      expect(expiresAtIndex).toBeDefined();
    });
  });

  describe('Timestamps', () => {
    test('should automatically set createdAt and updatedAt', async () => {
      const blacklistedAt = new Date();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      
      const token = await BlacklistedToken.create({
        token: 'sample.jwt.token',
        blacklistedAt,
        expiresAt,
      });

      expect(token.createdAt).toBeInstanceOf(Date);
      expect(token.updatedAt).toBeInstanceOf(Date);
    });

    test('should update updatedAt on modification', async () => {
      const blacklistedAt = new Date();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      
      const token = await BlacklistedToken.create({
        token: 'sample.jwt.token',
        blacklistedAt,
        expiresAt,
      });

      const originalUpdatedAt = token.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      token.expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      await token.save();

      expect(token.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });
  });

  describe('cleanup() Static Method', () => {
    test('should remove expired blacklisted tokens', async () => {
      const blacklistedAt = new Date();
      
      // Create expired token
      const expiredDate = new Date(Date.now() - 1000); // 1 second ago
      await BlacklistedToken.create({
        token: 'expired.jwt.token',
        blacklistedAt,
        expiresAt: expiredDate,
      });

      // Create valid token
      const futureDate = new Date(Date.now() + 15 * 60 * 1000);
      await BlacklistedToken.create({
        token: 'valid.jwt.token',
        blacklistedAt,
        expiresAt: futureDate,
      });

      // Verify both tokens exist
      let tokens = await BlacklistedToken.findAll();
      expect(tokens.length).toBe(2);

      // Run cleanup
      const deletedCount = await BlacklistedToken.cleanup();
      expect(deletedCount).toBe(1);

      // Verify only valid token remains
      tokens = await BlacklistedToken.findAll();
      expect(tokens.length).toBe(1);
      expect(tokens[0].token).toBe('valid.jwt.token');
    });

    test('should not remove non-expired tokens', async () => {
      const blacklistedAt = new Date();
      const futureDate = new Date(Date.now() + 15 * 60 * 1000);
      
      // Create multiple valid tokens
      await BlacklistedToken.create({
        token: 'valid.token.1',
        blacklistedAt,
        expiresAt: futureDate,
      });
      await BlacklistedToken.create({
        token: 'valid.token.2',
        blacklistedAt,
        expiresAt: futureDate,
      });

      // Run cleanup
      const deletedCount = await BlacklistedToken.cleanup();
      expect(deletedCount).toBe(0);

      // Verify all tokens remain
      const tokens = await BlacklistedToken.findAll();
      expect(tokens.length).toBe(2);
    });

    test('should return count of deleted tokens', async () => {
      const blacklistedAt = new Date();
      const expiredDate = new Date(Date.now() - 1000);
      
      // Create multiple expired tokens
      await BlacklistedToken.create({
        token: 'expired.token.1',
        blacklistedAt,
        expiresAt: expiredDate,
      });
      await BlacklistedToken.create({
        token: 'expired.token.2',
        blacklistedAt,
        expiresAt: expiredDate,
      });
      await BlacklistedToken.create({
        token: 'expired.token.3',
        blacklistedAt,
        expiresAt: expiredDate,
      });

      // Run cleanup
      const deletedCount = await BlacklistedToken.cleanup();
      expect(deletedCount).toBe(3);

      // Verify all tokens are removed
      const tokens = await BlacklistedToken.findAll();
      expect(tokens.length).toBe(0);
    });

    test('should handle cleanup when no tokens exist', async () => {
      // Run cleanup on empty table
      const deletedCount = await BlacklistedToken.cleanup();
      expect(deletedCount).toBe(0);
    });
  });

  describe('Token Storage', () => {
    test('should store long token strings', async () => {
      const longToken = 'a'.repeat(500); // Very long token
      const blacklistedAt = new Date();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      
      const token = await BlacklistedToken.create({
        token: longToken,
        blacklistedAt,
        expiresAt,
      });

      expect(token.token).toBe(longToken);
      expect(token.token.length).toBe(500);
    });

    test('should store blacklistedAt timestamp correctly', async () => {
      const blacklistedAt = new Date('2024-01-15T10:30:00Z');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      
      const token = await BlacklistedToken.create({
        token: 'sample.jwt.token',
        blacklistedAt,
        expiresAt,
      });

      expect(token.blacklistedAt.toISOString()).toBe(blacklistedAt.toISOString());
    });

    test('should allow different tokens with different expiration times', async () => {
      const blacklistedAt = new Date();
      
      await BlacklistedToken.create({
        token: 'access.token',
        blacklistedAt,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      });
      
      await BlacklistedToken.create({
        token: 'refresh.token',
        blacklistedAt,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      const tokens = await BlacklistedToken.findAll();
      expect(tokens.length).toBe(2);
    });
  });

  describe('Query Performance', () => {
    test('should efficiently find token by value', async () => {
      const blacklistedAt = new Date();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      
      // Create multiple tokens
      for (let i = 0; i < 10; i++) {
        await BlacklistedToken.create({
          token: `token.${i}`,
          blacklistedAt,
          expiresAt,
        });
      }

      // Find specific token (should use index)
      const found = await BlacklistedToken.findOne({
        where: { token: 'token.5' },
      });

      expect(found).toBeDefined();
      expect(found.token).toBe('token.5');
    });

    test('should efficiently query by expiresAt', async () => {
      const blacklistedAt = new Date();
      const now = new Date();
      
      // Create tokens with different expiration times
      await BlacklistedToken.create({
        token: 'expired.1',
        blacklistedAt,
        expiresAt: new Date(now.getTime() - 1000),
      });
      await BlacklistedToken.create({
        token: 'expired.2',
        blacklistedAt,
        expiresAt: new Date(now.getTime() - 2000),
      });
      await BlacklistedToken.create({
        token: 'valid.1',
        blacklistedAt,
        expiresAt: new Date(now.getTime() + 1000),
      });

      // Query expired tokens (should use index)
      const expiredTokens = await BlacklistedToken.findAll({
        where: {
          expiresAt: {
            [require('sequelize').Op.lt]: now,
          },
        },
      });

      expect(expiredTokens.length).toBe(2);
    });
  });
});
