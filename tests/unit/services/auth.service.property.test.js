'use strict';

// Load environment variables before importing modules
require('dotenv').config();

/**
 * Property-Based Tests for Auth Service
 * 
 * Tests universal properties of user registration, login, token refresh, and logout.
 * Uses fast-check for property-based testing with 100 iterations per property.
 */

const fc = require('fast-check');
const { Sequelize } = require('sequelize');
const authService = require('../../../src/services/auth.service');
const tokenService = require('../../../src/services/token.service');
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

/**
 * Property 1: Valid Registration Creates User
 * **Validates: Requirements 1.1**
 * 
 * For any valid email and password combination, registering a user SHALL create
 * a User record in the database with the provided email.
 */
describe('Property 1: Valid Registration Creates User', () => {
  test('any valid email and password creates a User record', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(), // valid email generator
        fc.string({ minLength: 8, maxLength: 100 }), // valid password generator
        async (email, password) => {
          const result = await authService.register(email, password);
          
          // Should return userId
          expect(result).toHaveProperty('userId');
          expect(typeof result.userId).toBe('number');
          
          // User should exist in database
          const user = await User.findOne({ where: { email } });
          expect(user).not.toBeNull();
          expect(user.email).toBe(email);
          expect(user.id).toBe(result.userId);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 2: Duplicate Email Registration Fails
 * **Validates: Requirements 1.2**
 * 
 * For any email address, attempting to register a second user with the same email
 * SHALL fail with a conflict error.
 */
describe('Property 2: Duplicate Email Registration Fails', () => {
  test('registering same email twice fails with ConflictError', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 100 }),
        fc.string({ minLength: 8, maxLength: 100 }),
        async (email, password1, password2) => {
          // First registration should succeed
          await authService.register(email, password1);
          
          // Second registration with same email should fail
          await expect(
            authService.register(email, password2)
          ).rejects.toThrow(ConflictError);
          
          await expect(
            authService.register(email, password2)
          ).rejects.toThrow('Email already registered');
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 4: Invalid Email Format Rejected
 * **Validates: Requirements 1.4**
 * 
 * For any string that does not match valid email format, registration SHALL fail
 * with a validation error.
 */
describe('Property 4: Invalid Email Format Rejected', () => {
  // Generator for invalid email formats
  const invalidEmailGen = fc.oneof(
    fc.string().filter(s => !s.includes('@')), // no @ symbol
    fc.constant('not-an-email'),
    fc.constant('@example.com'), // missing local part
    fc.constant('user@'), // missing domain
    fc.constant('user@.com'), // invalid domain
    fc.constant(''), // empty string
  );

  test('invalid email formats are rejected with ValidationError', async () => {
    await fc.assert(
      fc.asyncProperty(
        invalidEmailGen,
        fc.string({ minLength: 8, maxLength: 100 }),
        async (invalidEmail, password) => {
          await expect(
            authService.register(invalidEmail, password)
          ).rejects.toThrow(ValidationError);
          
          await expect(
            authService.register(invalidEmail, password)
          ).rejects.toThrow('Invalid email format');
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 5: Short Password Rejected
 * **Validates: Requirements 1.5**
 * 
 * For any password with length less than 8 characters, registration SHALL fail
 * with a validation error.
 */
describe('Property 5: Short Password Rejected', () => {
  test('passwords under 8 characters are rejected with ValidationError', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ maxLength: 7 }), // short password generator
        async (email, shortPassword) => {
          await expect(
            authService.register(email, shortPassword)
          ).rejects.toThrow(ValidationError);
          
          await expect(
            authService.register(email, shortPassword)
          ).rejects.toThrow('Password must be at least 8 characters');
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 6: Registration Response Contains User ID
 * **Validates: Requirements 1.6**
 * 
 * For any successful registration, the response SHALL contain a userId field.
 */
describe('Property 6: Registration Response Contains User ID', () => {
  test('successful registration returns userId', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 100 }),
        async (email, password) => {
          const result = await authService.register(email, password);
          
          expect(result).toHaveProperty('userId');
          expect(typeof result.userId).toBe('number');
          expect(result.userId).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 7: Password Hash Never Exposed
 * **Validates: Requirements 1.7**
 * 
 * For any registration request (success or failure), the response SHALL NOT
 * contain the passwordHash field.
 */
describe('Property 7: Password Hash Never Exposed', () => {
  test('registration response never contains passwordHash', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 100 }),
        async (email, password) => {
          const result = await authService.register(email, password);
          
          // Response should not contain passwordHash
          expect(result).not.toHaveProperty('passwordHash');
          expect(result).not.toHaveProperty('password');
          
          // Only userId should be present
          expect(Object.keys(result)).toEqual(['userId']);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 10: Valid Credentials Authenticate Successfully
 * **Validates: Requirements 3.1**
 * 
 * For any registered user, logging in with the correct email and password SHALL
 * succeed and return tokens.
 */
describe('Property 10: Valid Credentials Authenticate Successfully', () => {
  test('correct email and password returns tokens', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 100 }),
        async (email, password) => {
          // Register user first
          await authService.register(email, password);
          
          // Login with correct credentials
          const result = await authService.login(email, password);
          
          // Should return tokens and userId
          expect(result).toHaveProperty('accessToken');
          expect(result).toHaveProperty('refreshToken');
          expect(result).toHaveProperty('userId');
          expect(typeof result.accessToken).toBe('string');
          expect(typeof result.refreshToken).toBe('string');
          expect(typeof result.userId).toBe('number');
        }
      ),
      { numRuns: 100 }
    );
  }, 60000); // 60 second timeout for bcrypt operations
});

/**
 * Property 13: Login Returns Both Tokens
 * **Validates: Requirements 3.4**
 * 
 * For any successful login, the response SHALL contain both accessToken and
 * refreshToken fields.
 */
describe('Property 13: Login Returns Both Tokens', () => {
  test('successful login returns both accessToken and refreshToken', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 100 }),
        async (email, password) => {
          // Register user first
          await authService.register(email, password);
          
          // Login
          const result = await authService.login(email, password);
          
          // Should have both tokens
          expect(result).toHaveProperty('accessToken');
          expect(result).toHaveProperty('refreshToken');
          expect(result.accessToken).toBeTruthy();
          expect(result.refreshToken).toBeTruthy();
          expect(result.accessToken).not.toBe(result.refreshToken);
        }
      ),
      { numRuns: 100 }
    );
  }, 60000); // 60 second timeout for bcrypt operations
});

/**
 * Property 14: Invalid Credentials Generic Error
 * **Validates: Requirements 3.5**
 * 
 * For any invalid email/password combination (wrong email, wrong password, or both),
 * login SHALL fail with a generic authentication error that does not reveal which
 * credential was incorrect.
 */
describe('Property 14: Invalid Credentials Generic Error', () => {
  test('wrong email returns generic error', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 100 }),
        async (email1, email2, password) => {
          // Skip if emails are the same
          if (email1 === email2) return;
          
          // Register user with email1
          await authService.register(email1, password);
          
          // Try to login with wrong email (email2)
          await expect(
            authService.login(email2, password)
          ).rejects.toThrow(UnauthorizedError);
          
          await expect(
            authService.login(email2, password)
          ).rejects.toThrow('Invalid credentials');
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);

  test('wrong password returns generic error', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 100 }),
        fc.string({ minLength: 8, maxLength: 100 }),
        async (email, password1, password2) => {
          // Skip if passwords are the same
          if (password1 === password2) return;
          
          // Register user with password1
          await authService.register(email, password1);
          
          // Try to login with wrong password (password2)
          await expect(
            authService.login(email, password2)
          ).rejects.toThrow(UnauthorizedError);
          
          await expect(
            authService.login(email, password2)
          ).rejects.toThrow('Invalid credentials');
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);
});

/**
 * Property 20: Valid Refresh Token Generates New Access Token
 * **Validates: Requirements 5.1, 5.2, 5.4**
 * 
 * For any valid refresh token that is not blacklisted, sending a refresh request
 * SHALL generate and return a new access token.
 */
describe('Property 20: Valid Refresh Token Generates New Access Token', () => {
  test('valid refresh token returns new access token', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 100 }),
        async (email, password) => {
          // Clean database before each iteration to avoid conflicts
          await User.destroy({ where: {}, truncate: true, cascade: true });
          await RefreshToken.destroy({ where: {}, truncate: true });
          await BlacklistedToken.destroy({ where: {}, truncate: true });
          
          // Register and login
          await authService.register(email, password);
          const loginResult = await authService.login(email, password);
          
          // Wait 1 second to ensure different timestamp (iat claim)
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Use refresh token to get new access token
          const refreshResult = await authService.refresh(loginResult.refreshToken);
          
          // Should return new access token
          expect(refreshResult).toHaveProperty('accessToken');
          expect(typeof refreshResult.accessToken).toBe('string');
          expect(refreshResult.accessToken).toBeTruthy();
          
          // Verify the token is valid and contains userId
          const decoded = tokenService.verifyToken(refreshResult.accessToken, 'access');
          expect(decoded.userId).toBe(loginResult.userId);
          
          // New access token should be different from original (due to different iat)
          expect(refreshResult.accessToken).not.toBe(loginResult.accessToken);
        }
      ),
      { numRuns: 20 } // Reduced from 100 due to 1-second delay per iteration
    );
  }, 60000);
});

/**
 * Property 21: Refresh Token Must Exist in Database
 * **Validates: Requirements 5.3**
 * 
 * For any token not stored in the RefreshToken table, attempting to use it for
 * refresh SHALL fail with an authentication error.
 */
describe('Property 21: Refresh Token Must Exist in Database', () => {
  test('tokens not in database fail refresh', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }),
        async (userId) => {
          // Generate a token that's not stored in database
          const fakeToken = tokenService.generateAccessToken(userId);
          
          // Try to refresh with token not in database
          await expect(
            authService.refresh(fakeToken)
          ).rejects.toThrow(UnauthorizedError);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 26: Logout Blacklists Tokens
 * **Validates: Requirements 7.1, 7.6**
 * 
 * For any logout request with a refresh token (and optionally an access token),
 * both provided tokens SHALL be added to the BlacklistedToken table.
 */
describe('Property 26: Logout Blacklists Tokens', () => {
  test('logout adds refresh token to blacklist', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 100 }),
        async (email, password) => {
          // Register and login
          await authService.register(email, password);
          const loginResult = await authService.login(email, password);
          
          // Logout
          await authService.logout(loginResult.refreshToken);
          
          // Refresh token should be blacklisted
          const isBlacklisted = await tokenService.isBlacklisted(loginResult.refreshToken);
          expect(isBlacklisted).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);

  test('logout adds both refresh and access tokens to blacklist', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 100 }),
        async (email, password) => {
          // Register and login
          await authService.register(email, password);
          const loginResult = await authService.login(email, password);
          
          // Logout with both tokens
          await authService.logout(loginResult.refreshToken, loginResult.accessToken);
          
          // Both tokens should be blacklisted
          const refreshBlacklisted = await tokenService.isBlacklisted(loginResult.refreshToken);
          const accessBlacklisted = await tokenService.isBlacklisted(loginResult.accessToken);
          expect(refreshBlacklisted).toBe(true);
          expect(accessBlacklisted).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);
});

/**
 * Property 27: Blacklisted Token Timestamp Recorded
 * **Validates: Requirements 7.2**
 * 
 * For any token added to the blacklist, the BlacklistedToken record SHALL have
 * a blacklistedAt timestamp.
 */
describe('Property 27: Blacklisted Token Timestamp Recorded', () => {
  test('blacklisted tokens have blacklistedAt timestamp', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 100 }),
        async (email, password) => {
          // Register and login
          await authService.register(email, password);
          const loginResult = await authService.login(email, password);
          
          const beforeLogout = Date.now();
          
          // Logout
          await authService.logout(loginResult.refreshToken, loginResult.accessToken);
          
          const afterLogout = Date.now();
          
          // Check blacklisted tokens have timestamps
          const refreshRecord = await BlacklistedToken.findOne({
            where: { token: loginResult.refreshToken }
          });
          const accessRecord = await BlacklistedToken.findOne({
            where: { token: loginResult.accessToken }
          });
          
          expect(refreshRecord).not.toBeNull();
          expect(refreshRecord.blacklistedAt).toBeInstanceOf(Date);
          expect(refreshRecord.blacklistedAt.getTime()).toBeGreaterThanOrEqual(beforeLogout);
          expect(refreshRecord.blacklistedAt.getTime()).toBeLessThanOrEqual(afterLogout);
          
          expect(accessRecord).not.toBeNull();
          expect(accessRecord.blacklistedAt).toBeInstanceOf(Date);
          expect(accessRecord.blacklistedAt.getTime()).toBeGreaterThanOrEqual(beforeLogout);
          expect(accessRecord.blacklistedAt.getTime()).toBeLessThanOrEqual(afterLogout);
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);
});
