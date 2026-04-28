'use strict';

/**
 * Password Service
 * 
 * Provides secure password hashing and verification using bcrypt.
 * 
 * Validates: Requirements 2.1, 2.3, 2.4, 12.4, 13.5
 */

const bcrypt = require('bcrypt');
const { getBcryptConfig } = require('../config/env');

/**
 * Hash a password using bcrypt with configurable salt rounds
 * 
 * Generates a unique salt for each password and hashes it using bcrypt.
 * 
 * @param {string} password - The plaintext password to hash
 * @returns {Promise<string>} The bcrypt hash
 * @throws {Error} If password is empty or hashing fails
 * 
 * Validates: Requirements 2.1, 2.3, 12.4
 */
async function hash(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }

  const { saltRounds } = getBcryptConfig();
  
  // bcrypt.hash automatically generates a unique salt per password
  const passwordHash = await bcrypt.hash(password, saltRounds);
  
  return passwordHash;
}

/**
 * Verify a password against a bcrypt hash
 * 
 * Uses bcrypt's timing-safe comparison to prevent timing attacks.
 * 
 * @param {string} password - The plaintext password to verify
 * @param {string} hash - The bcrypt hash to compare against
 * @returns {Promise<boolean>} True if password matches hash, false otherwise
 * @throws {Error} If password or hash is invalid
 * 
 * Validates: Requirements 2.4, 13.5
 */
async function verify(password, hash) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  
  if (!hash || typeof hash !== 'string') {
    throw new Error('Hash must be a non-empty string');
  }

  // bcrypt.compare uses timing-safe comparison internally
  const isValid = await bcrypt.compare(password, hash);
  
  return isValid;
}

module.exports = {
  hash,
  verify
};
