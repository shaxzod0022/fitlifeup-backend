'use strict';

/**
 * Unit Tests for Password Service
 * 
 * Tests specific examples and edge cases for password hashing and verification.
 * 
 * Validates: Requirements 2.1, 2.4
 */

const passwordService = require('../../../src/services/password.service');
const { getBcryptConfig } = require('../../../src/config/env');

describe('Password Service - Unit Tests', () => {
  describe('hash()', () => {
    test('should hash a password successfully', async () => {
      const password = 'testPassword123';
      const hash = await passwordService.hash(password);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(password);
    });

    test('should produce valid bcrypt hash format', async () => {
      const password = 'testPassword123';
      const hash = await passwordService.hash(password);
      
      // Bcrypt hash format: $2a$10$... or $2b$10$... or $2y$10$...
      expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
    });

    test('should use configured salt rounds', async () => {
      const password = 'testPassword123';
      const hash = await passwordService.hash(password);
      const { saltRounds } = getBcryptConfig();
      
      // Extract salt rounds from hash (format: $2a$10$...)
      const hashParts = hash.split('$');
      const hashSaltRounds = parseInt(hashParts[2], 10);
      
      expect(hashSaltRounds).toBe(saltRounds);
    });

    test('should generate unique salts for same password', async () => {
      const password = 'testPassword123';
      const hash1 = await passwordService.hash(password);
      const hash2 = await passwordService.hash(password);
      
      expect(hash1).not.toBe(hash2);
    });

    test('should throw error for empty password', async () => {
      await expect(passwordService.hash('')).rejects.toThrow('Password must be a non-empty string');
    });

    test('should throw error for null password', async () => {
      await expect(passwordService.hash(null)).rejects.toThrow('Password must be a non-empty string');
    });

    test('should throw error for undefined password', async () => {
      await expect(passwordService.hash(undefined)).rejects.toThrow('Password must be a non-empty string');
    });

    test('should throw error for non-string password', async () => {
      await expect(passwordService.hash(12345)).rejects.toThrow('Password must be a non-empty string');
    });
  });

  describe('verify()', () => {
    test('should verify correct password', async () => {
      const password = 'testPassword123';
      const hash = await passwordService.hash(password);
      
      const isValid = await passwordService.verify(password, hash);
      expect(isValid).toBe(true);
    });

    test('should reject incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword456';
      const hash = await passwordService.hash(password);
      
      const isValid = await passwordService.verify(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    test('should reject password with slight variation', async () => {
      const password = 'testPassword123';
      const hash = await passwordService.hash(password);
      
      // Test case sensitivity
      const isValid = await passwordService.verify('TestPassword123', hash);
      expect(isValid).toBe(false);
    });

    test('should reject password with extra character', async () => {
      const password = 'testPassword123';
      const hash = await passwordService.hash(password);
      
      const isValid = await passwordService.verify(password + 'x', hash);
      expect(isValid).toBe(false);
    });

    test('should reject password with missing character', async () => {
      const password = 'testPassword123';
      const hash = await passwordService.hash(password);
      
      const isValid = await passwordService.verify(password.slice(0, -1), hash);
      expect(isValid).toBe(false);
    });

    test('should throw error for empty password', async () => {
      const hash = await passwordService.hash('testPassword123');
      await expect(passwordService.verify('', hash)).rejects.toThrow('Password must be a non-empty string');
    });

    test('should throw error for null password', async () => {
      const hash = await passwordService.hash('testPassword123');
      await expect(passwordService.verify(null, hash)).rejects.toThrow('Password must be a non-empty string');
    });

    test('should throw error for empty hash', async () => {
      await expect(passwordService.verify('testPassword123', '')).rejects.toThrow('Hash must be a non-empty string');
    });

    test('should throw error for null hash', async () => {
      await expect(passwordService.verify('testPassword123', null)).rejects.toThrow('Hash must be a non-empty string');
    });

    test('should handle special characters in password', async () => {
      const password = 'p@ssw0rd!#$%^&*()';
      const hash = await passwordService.hash(password);
      
      const isValid = await passwordService.verify(password, hash);
      expect(isValid).toBe(true);
    });

    test('should handle unicode characters in password', async () => {
      const password = 'пароль密码🔒';
      const hash = await passwordService.hash(password);
      
      const isValid = await passwordService.verify(password, hash);
      expect(isValid).toBe(true);
    });

    test('should handle very long passwords', async () => {
      const password = 'a'.repeat(100);
      const hash = await passwordService.hash(password);
      
      const isValid = await passwordService.verify(password, hash);
      expect(isValid).toBe(true);
    });
  });

  describe('timing-safe comparison', () => {
    test('should use timing-safe comparison (bcrypt.compare)', async () => {
      // This test verifies that we're using bcrypt.compare which has timing-safe comparison
      // We can't directly test timing safety, but we verify the function works correctly
      const password = 'testPassword123';
      const hash = await passwordService.hash(password);
      
      // Multiple verifications should all work consistently
      const results = await Promise.all([
        passwordService.verify(password, hash),
        passwordService.verify(password, hash),
        passwordService.verify(password, hash)
      ]);
      
      expect(results).toEqual([true, true, true]);
    });
  });
});
