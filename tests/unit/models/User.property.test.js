'use strict';

const fc = require('fast-check');
const { Sequelize } = require('sequelize');
const { User, initUser } = require('../../../src/models/User');

describe('User Model - Property-Based Tests', () => {
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

  /**
   * Property 1: Valid Registration Creates User
   * **Validates: Requirements 1.1**
   * 
   * For any valid email and password combination, registering a user SHALL create 
   * a User record in the database with the provided email.
   */
  test('Property 1: Valid Registration Creates User', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 100 }),
        async (email, password) => {
          // Hash the password (simulating what the auth service would do)
          const passwordHash = `hashed_${password}`;

          // Create user with valid email and password hash
          const user = await User.create({
            email,
            passwordHash,
          });

          // Verify user was created
          expect(user).toBeDefined();
          expect(user.id).toBeDefined();
          expect(user.email).toBe(email);
          expect(user.passwordHash).toBe(passwordHash);
          expect(user.createdAt).toBeInstanceOf(Date);
          expect(user.updatedAt).toBeInstanceOf(Date);

          // Verify user exists in database
          const foundUser = await User.findOne({ where: { email } });
          expect(foundUser).not.toBeNull();
          expect(foundUser.id).toBe(user.id);
          expect(foundUser.email).toBe(email);

          // Clean up for next iteration
          await User.destroy({ where: { id: user.id } });
        }
      ),
      { numRuns: 100 }
    );
  });
});
