'use strict';

const { Sequelize } = require('sequelize');
const { User, initUser } = require('../../../src/models/User');

describe('User Model', () => {
  let sequelize;

  beforeAll(async () => {
    // Create in-memory SQLite database for testing
    sequelize = new Sequelize('sqlite::memory:', {
      logging: false,
    });

    // Initialize the User model
    initUser(sequelize);

    // Sync the database
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  afterEach(async () => {
    // Clean up after each test
    await User.destroy({ where: {}, truncate: true });
  });

  describe('Schema Validation', () => {
    test('should create a user with valid email and passwordHash', async () => {
      const user = await User.create({
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.passwordHash).toBe('hashedpassword123');
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    test('should enforce email uniqueness', async () => {
      await User.create({
        email: 'duplicate@example.com',
        passwordHash: 'hash1',
      });

      await expect(
        User.create({
          email: 'duplicate@example.com',
          passwordHash: 'hash2',
        })
      ).rejects.toThrow();
    });

    test('should validate email format', async () => {
      await expect(
        User.create({
          email: 'invalid-email',
          passwordHash: 'hashedpassword',
        })
      ).rejects.toThrow(/Invalid email format/);
    });

    test('should reject null email', async () => {
      await expect(
        User.create({
          email: null,
          passwordHash: 'hashedpassword',
        })
      ).rejects.toThrow();
    });

    test('should reject null passwordHash', async () => {
      await expect(
        User.create({
          email: 'test@example.com',
          passwordHash: null,
        })
      ).rejects.toThrow();
    });
  });

  describe('Timestamps', () => {
    test('should automatically set createdAt and updatedAt', async () => {
      const user = await User.create({
        email: 'timestamp@example.com',
        passwordHash: 'hashedpassword',
      });

      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    test('should update updatedAt on modification', async () => {
      const user = await User.create({
        email: 'update@example.com',
        passwordHash: 'hashedpassword',
      });

      const originalUpdatedAt = user.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      user.passwordHash = 'newhashedpassword';
      await user.save();

      expect(user.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });
  });

  describe('Email Index', () => {
    test('should have unique index on email field', async () => {
      const indexes = await sequelize
        .getQueryInterface()
        .showIndex(User.tableName);

      const emailIndex = indexes.find((index) =>
        index.fields.some((field) => field.attribute === 'email')
      );

      expect(emailIndex).toBeDefined();
      expect(emailIndex.unique).toBe(true);
    });
  });
});
