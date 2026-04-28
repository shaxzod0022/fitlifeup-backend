'use strict';

/**
 * Property-Based Tests for Password Service
 * 
 * Tests universal properties of password hashing and verification
 * using fast-check for property-based testing.
 */

const fc = require('fast-check');
const passwordService = require('../../../src/services/password.service');

describe('Password Service - Property-Based Tests', () => {
  /**
   * Property 3: Password Hashing Before Storage
   * 
   * **Validates: Requirements 1.3, 2.2**
   * 
   * For any password, the stored passwordHash in the database SHALL be 
   * a valid bcrypt hash and SHALL NOT equal the plaintext password.
   */
  test('Property 3: Password hashing before storage', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 8, maxLength: 100 }), // password generator
        async (password) => {
          const hash = await passwordService.hash(password);
          
          // Hash should not equal plaintext
          expect(hash).not.toBe(password);
          
          // Hash should be valid bcrypt format ($2a$, $2b$, or $2y$ followed by rounds and salt/hash)
          expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
          
          // Hash should be verifiable
          const isValid = await passwordService.verify(password, hash);
          expect(isValid).toBe(true);
        }
      ),
      { numRuns: 20 } // Reduced from 100 due to bcrypt computational cost
    );
  }, 30000); // 30 second timeout for bcrypt operations

  /**
   * Property 8: Unique Salt Per Password
   * 
   * **Validates: Requirements 2.3**
   * 
   * For any password, hashing it twice SHALL produce different hash values 
   * due to unique salt generation.
   */
  test('Property 8: Unique salt per password', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 8, maxLength: 100 }), // password generator
        async (password) => {
          const hash1 = await passwordService.hash(password);
          const hash2 = await passwordService.hash(password);
          
          // Two hashes of the same password should be different (unique salts)
          expect(hash1).not.toBe(hash2);
          
          // Both hashes should verify correctly
          expect(await passwordService.verify(password, hash1)).toBe(true);
          expect(await passwordService.verify(password, hash2)).toBe(true);
        }
      ),
      { numRuns: 20 } // Reduced from 100 due to bcrypt computational cost
    );
  }, 60000); // 60 second timeout for bcrypt operations (2 hashes + 2 verifications per run)

  /**
   * Property 9: Password Verification Round-Trip
   * 
   * **Validates: Requirements 2.4**
   * 
   * For any password, after hashing it, verifying the original password 
   * against the hash SHALL return true.
   */
  test('Property 9: Password verification round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 8, maxLength: 100 }), // password generator
        async (password) => {
          const hash = await passwordService.hash(password);
          
          // Original password should verify successfully
          const isValid = await passwordService.verify(password, hash);
          expect(isValid).toBe(true);
          
          // A different password should NOT verify
          const wrongPassword = password + 'x'; // Append character to make it different
          const isInvalid = await passwordService.verify(wrongPassword, hash);
          expect(isInvalid).toBe(false);
        }
      ),
      { numRuns: 20 } // Reduced from 100 due to bcrypt computational cost
    );
  }, 40000); // 40 second timeout for bcrypt operations (1 hash + 2 verifications per run)
});
