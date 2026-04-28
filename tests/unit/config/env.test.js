'use strict';

const { validateEnvironment, getJWTConfig, getBcryptConfig } = require('../../../src/config/env');

describe('Environment Configuration', () => {
  let originalEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('validateEnvironment', () => {
    test('should pass when JWT_SECRET is provided', () => {
      process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long';
      
      expect(() => validateEnvironment()).not.toThrow();
    });

    test('should throw error when JWT_SECRET is missing', () => {
      delete process.env.JWT_SECRET;
      
      expect(() => validateEnvironment()).toThrow('Missing required environment variables: JWT_SECRET');
    });

    test('should throw error when JWT_SECRET is shorter than 32 characters', () => {
      process.env.JWT_SECRET = 'short-secret';
      
      expect(() => validateEnvironment()).toThrow('JWT_SECRET must be at least 32 characters long');
    });

    test('should throw error when JWT_ACCESS_EXPIRY has invalid format', () => {
      process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long';
      process.env.JWT_ACCESS_EXPIRY = 'invalid';
      
      expect(() => validateEnvironment()).toThrow('JWT_ACCESS_EXPIRY must have valid format');
    });

    test('should throw error when JWT_ACCESS_EXPIRY has no time unit', () => {
      process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long';
      process.env.JWT_ACCESS_EXPIRY = '15';
      
      expect(() => validateEnvironment()).toThrow('JWT_ACCESS_EXPIRY must have valid format');
    });

    test('should pass when JWT_ACCESS_EXPIRY has valid format', () => {
      process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long';
      process.env.JWT_ACCESS_EXPIRY = '15m';
      
      expect(() => validateEnvironment()).not.toThrow();
    });

    test('should pass when JWT_ACCESS_EXPIRY uses seconds format', () => {
      process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long';
      process.env.JWT_ACCESS_EXPIRY = '900s';
      
      expect(() => validateEnvironment()).not.toThrow();
    });

    test('should pass when JWT_ACCESS_EXPIRY uses hours format', () => {
      process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long';
      process.env.JWT_ACCESS_EXPIRY = '1h';
      
      expect(() => validateEnvironment()).not.toThrow();
    });

    test('should throw error when JWT_REFRESH_EXPIRY has invalid format', () => {
      process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long';
      process.env.JWT_REFRESH_EXPIRY = 'invalid';
      
      expect(() => validateEnvironment()).toThrow('JWT_REFRESH_EXPIRY must have valid format');
    });

    test('should pass when JWT_REFRESH_EXPIRY has valid format', () => {
      process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long';
      process.env.JWT_REFRESH_EXPIRY = '7d';
      
      expect(() => validateEnvironment()).not.toThrow();
    });

    test('should throw error when BCRYPT_SALT_ROUNDS is less than 10', () => {
      process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long';
      process.env.BCRYPT_SALT_ROUNDS = '5';
      
      expect(() => validateEnvironment()).toThrow('BCRYPT_SALT_ROUNDS must be a number >= 10');
    });

    test('should throw error when BCRYPT_SALT_ROUNDS is not a number', () => {
      process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long';
      process.env.BCRYPT_SALT_ROUNDS = 'invalid';
      
      expect(() => validateEnvironment()).toThrow('BCRYPT_SALT_ROUNDS must be a number >= 10');
    });

    test('should pass when BCRYPT_SALT_ROUNDS is 10 or greater', () => {
      process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long';
      process.env.BCRYPT_SALT_ROUNDS = '12';
      
      expect(() => validateEnvironment()).not.toThrow();
    });

    test('should pass when optional environment variables are not provided', () => {
      process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long';
      delete process.env.JWT_ACCESS_EXPIRY;
      delete process.env.JWT_REFRESH_EXPIRY;
      delete process.env.BCRYPT_SALT_ROUNDS;
      
      expect(() => validateEnvironment()).not.toThrow();
    });
  });

  describe('getJWTConfig', () => {
    test('should return JWT configuration with provided values', () => {
      process.env.JWT_SECRET = 'test-secret-key';
      process.env.JWT_ACCESS_EXPIRY = '30m';
      process.env.JWT_REFRESH_EXPIRY = '14d';
      
      const config = getJWTConfig();
      
      expect(config).toEqual({
        secret: 'test-secret-key',
        accessExpiry: '30m',
        refreshExpiry: '14d'
      });
    });

    test('should return default values for optional JWT configuration', () => {
      process.env.JWT_SECRET = 'test-secret-key';
      delete process.env.JWT_ACCESS_EXPIRY;
      delete process.env.JWT_REFRESH_EXPIRY;
      
      const config = getJWTConfig();
      
      expect(config).toEqual({
        secret: 'test-secret-key',
        accessExpiry: '15m',
        refreshExpiry: '7d'
      });
    });
  });

  describe('getBcryptConfig', () => {
    test('should return bcrypt configuration with provided value', () => {
      process.env.BCRYPT_SALT_ROUNDS = '12';
      
      const config = getBcryptConfig();
      
      expect(config).toEqual({
        saltRounds: 12
      });
    });

    test('should return default value when BCRYPT_SALT_ROUNDS is not provided', () => {
      delete process.env.BCRYPT_SALT_ROUNDS;
      
      const config = getBcryptConfig();
      
      expect(config).toEqual({
        saltRounds: 10
      });
    });

    test('should parse BCRYPT_SALT_ROUNDS as integer', () => {
      process.env.BCRYPT_SALT_ROUNDS = '15';
      
      const config = getBcryptConfig();
      
      expect(config.saltRounds).toBe(15);
      expect(typeof config.saltRounds).toBe('number');
    });
  });
});
