'use strict';

const { Sequelize } = require('sequelize');
const { User, initUser } = require('../../../src/models/User');
const { RefreshToken, initRefreshToken } = require('../../../src/models/RefreshToken');

describe('RefreshToken Model', () => {
  let sequelize;
  let testUser;

  beforeAll(async () => {
    // Create in-memory SQLite database for testing
    sequelize = new Sequelize('sqlite::memory:', {
      logging: false,
    });

    // Initialize models
    initUser(sequelize);
    initRefreshToken(sequelize);

    // Set up associations
    RefreshToken.belongsTo(User, { foreignKey: 'userId' });
    User.hasMany(RefreshToken, { foreignKey: 'userId' });

    // Sync the database
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Create a test user before each test
    testUser = await User.create({
      email: 'test@example.com',
      passwordHash: 'hashedpassword123',
    });
  });

  afterEach(async () => {
    // Clean up after each test
    await RefreshToken.destroy({ where: {}, truncate: true });
    await User.destroy({ where: {}, truncate: true });
  });

  describe('Schema Validation', () => {
    test('should create a refresh token with valid fields', async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      const token = await RefreshToken.create({
        userId: testUser.id,
        token: 'sample.jwt.token',
        expiresAt,
      });

      expect(token.id).toBeDefined();
      expect(token.userId).toBe(testUser.id);
      expect(token.token).toBe('sample.jwt.token');
      expect(token.expiresAt).toEqual(expiresAt);
      expect(token.createdAt).toBeDefined();
      expect(token.updatedAt).toBeDefined();
    });

    test('should reject null userId', async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      await expect(
        RefreshToken.create({
          userId: null,
          token: 'sample.jwt.token',
          expiresAt,
        })
      ).rejects.toThrow();
    });

    test('should reject null token', async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      await expect(
        RefreshToken.create({
          userId: testUser.id,
          token: null,
          expiresAt,
        })
      ).rejects.toThrow();
    });

    test('should reject null expiresAt', async () => {
      await expect(
        RefreshToken.create({
          userId: testUser.id,
          token: 'sample.jwt.token',
          expiresAt: null,
        })
      ).rejects.toThrow();
    });

    test('should reject invalid userId (foreign key constraint)', async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      await expect(
        RefreshToken.create({
          userId: 99999, // Non-existent user
          token: 'sample.jwt.token',
          expiresAt,
        })
      ).rejects.toThrow();
    });
  });

  describe('Foreign Key Relationship', () => {
    test('should establish belongsTo relationship with User', async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const token = await RefreshToken.create({
        userId: testUser.id,
        token: 'sample.jwt.token',
        expiresAt,
      });

      const user = await token.getUser();
      expect(user).toBeDefined();
      expect(user.id).toBe(testUser.id);
      expect(user.email).toBe('test@example.com');
    });

    test('should cascade delete tokens when user is deleted', async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await RefreshToken.create({
        userId: testUser.id,
        token: 'sample.jwt.token',
        expiresAt,
      });

      // Verify token exists
      let tokens = await RefreshToken.findAll({ where: { userId: testUser.id } });
      expect(tokens.length).toBe(1);

      // Delete user
      await testUser.destroy();

      // Verify tokens are deleted
      tokens = await RefreshToken.findAll({ where: { userId: testUser.id } });
      expect(tokens.length).toBe(0);
    });
  });

  describe('Indexes', () => {
    test('should have index on token field', async () => {
      const indexes = await sequelize
        .getQueryInterface()
        .showIndex(RefreshToken.tableName);

      const tokenIndex = indexes.find((index) =>
        index.fields.some((field) => field.attribute === 'token')
      );

      expect(tokenIndex).toBeDefined();
    });

    test('should have index on expiresAt field', async () => {
      const indexes = await sequelize
        .getQueryInterface()
        .showIndex(RefreshToken.tableName);

      const expiresAtIndex = indexes.find((index) =>
        index.fields.some((field) => field.attribute === 'expiresAt')
      );

      expect(expiresAtIndex).toBeDefined();
    });

    test('should have index on userId field', async () => {
      const indexes = await sequelize
        .getQueryInterface()
        .showIndex(RefreshToken.tableName);

      const userIdIndex = indexes.find((index) =>
        index.fields.some((field) => field.attribute === 'userId')
      );

      expect(userIdIndex).toBeDefined();
    });
  });

  describe('Timestamps', () => {
    test('should automatically set createdAt and updatedAt', async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const token = await RefreshToken.create({
        userId: testUser.id,
        token: 'sample.jwt.token',
        expiresAt,
      });

      expect(token.createdAt).toBeInstanceOf(Date);
      expect(token.updatedAt).toBeInstanceOf(Date);
    });

    test('should update updatedAt on modification', async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const token = await RefreshToken.create({
        userId: testUser.id,
        token: 'sample.jwt.token',
        expiresAt,
      });

      const originalUpdatedAt = token.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      token.token = 'updated.jwt.token';
      await token.save();

      expect(token.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });
  });

  describe('cleanup() Static Method', () => {
    test('should remove expired tokens', async () => {
      // Create expired token
      const expiredDate = new Date(Date.now() - 1000); // 1 second ago
      await RefreshToken.create({
        userId: testUser.id,
        token: 'expired.jwt.token',
        expiresAt: expiredDate,
      });

      // Create valid token
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await RefreshToken.create({
        userId: testUser.id,
        token: 'valid.jwt.token',
        expiresAt: futureDate,
      });

      // Verify both tokens exist
      let tokens = await RefreshToken.findAll();
      expect(tokens.length).toBe(2);

      // Run cleanup
      const deletedCount = await RefreshToken.cleanup();
      expect(deletedCount).toBe(1);

      // Verify only valid token remains
      tokens = await RefreshToken.findAll();
      expect(tokens.length).toBe(1);
      expect(tokens[0].token).toBe('valid.jwt.token');
    });

    test('should not remove non-expired tokens', async () => {
      // Create multiple valid tokens
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await RefreshToken.create({
        userId: testUser.id,
        token: 'valid.token.1',
        expiresAt: futureDate,
      });
      await RefreshToken.create({
        userId: testUser.id,
        token: 'valid.token.2',
        expiresAt: futureDate,
      });

      // Run cleanup
      const deletedCount = await RefreshToken.cleanup();
      expect(deletedCount).toBe(0);

      // Verify all tokens remain
      const tokens = await RefreshToken.findAll();
      expect(tokens.length).toBe(2);
    });

    test('should return count of deleted tokens', async () => {
      // Create multiple expired tokens
      const expiredDate = new Date(Date.now() - 1000);
      await RefreshToken.create({
        userId: testUser.id,
        token: 'expired.token.1',
        expiresAt: expiredDate,
      });
      await RefreshToken.create({
        userId: testUser.id,
        token: 'expired.token.2',
        expiresAt: expiredDate,
      });
      await RefreshToken.create({
        userId: testUser.id,
        token: 'expired.token.3',
        expiresAt: expiredDate,
      });

      // Run cleanup
      const deletedCount = await RefreshToken.cleanup();
      expect(deletedCount).toBe(3);

      // Verify all tokens are removed
      const tokens = await RefreshToken.findAll();
      expect(tokens.length).toBe(0);
    });

    test('should handle cleanup when no tokens exist', async () => {
      // Run cleanup on empty table
      const deletedCount = await RefreshToken.cleanup();
      expect(deletedCount).toBe(0);
    });
  });

  describe('Token Storage', () => {
    test('should store long token strings', async () => {
      const longToken = 'a'.repeat(500); // Very long token
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      const token = await RefreshToken.create({
        userId: testUser.id,
        token: longToken,
        expiresAt,
      });

      expect(token.token).toBe(longToken);
      expect(token.token.length).toBe(500);
    });

    test('should allow multiple tokens for same user', async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      await RefreshToken.create({
        userId: testUser.id,
        token: 'token.1',
        expiresAt,
      });
      
      await RefreshToken.create({
        userId: testUser.id,
        token: 'token.2',
        expiresAt,
      });

      const tokens = await RefreshToken.findAll({ where: { userId: testUser.id } });
      expect(tokens.length).toBe(2);
    });
  });
});
