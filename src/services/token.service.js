'use strict';

/**
 * Token Service
 * 
 * Provides JWT token generation, verification, blacklisting, and storage.
 * 
 * Validates: Requirements 3.2, 3.3, 3.6, 3.7, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6,
 *            5.3, 7.1, 7.2, 7.4, 7.5, 7.6, 11.1, 11.2, 11.3, 12.1, 12.2, 12.3
 */

const jwt = require('jsonwebtoken');
const { getJWTConfig } = require('../config/env');
const { RefreshToken } = require('../models/RefreshToken');
const { BlacklistedToken } = require('../models/BlacklistedToken');
const { UnauthorizedError } = require('../utils/errors');

/**
 * Generate an access token with 15-minute expiry
 * 
 * @param {number} userId - The user ID to include in the token payload
 * @returns {string} The signed JWT access token
 * 
 * Validates: Requirements 3.2, 4.1, 4.2, 4.3, 4.4, 4.5, 12.1, 12.2
 */
function generateAccessToken(userId, role = 'user', data = {}) {
  const config = getJWTConfig();
  
  const payload = {
    userId,
    role,
    permissions: data.permissions || [],
    type: 'access'
  };
  
  const options = {
    expiresIn: config.accessExpiry,
    algorithm: 'HS256'
  };
  
  return jwt.sign(payload, config.secret, options);
}

/**
 * Generate a refresh token with 7-day expiry and store it in the database
 * 
 * @param {number} userId - The user ID to include in the token payload
 * @returns {Promise<string>} The signed JWT refresh token
 * 
 * Validates: Requirements 3.3, 3.6, 4.1, 4.2, 4.3, 4.4, 4.6, 12.1, 12.3
 */
async function generateRefreshToken(userId, role = 'user', data = {}) {
  const config = getJWTConfig();
  
  const payload = {
    userId,
    role,
    permissions: data.permissions || [],
    type: 'refresh'
  };
  
  const options = {
    expiresIn: config.refreshExpiry,
    algorithm: 'HS256'
  };
  
  const token = jwt.sign(payload, config.secret, options);
  
  // Decode to get expiration timestamp
  const decoded = jwt.decode(token);
  const expiresAt = new Date(decoded.exp * 1000);
  
  // Store refresh token in database
  await storeRefreshToken(userId, token, expiresAt);
  
  return token;
}

/**
 * Verify and decode a JWT token
 * 
 * @param {string} token - The JWT token to verify
 * @param {string} type - Expected token type ('access' or 'refresh')
 * @returns {Object} Decoded token payload with userId, type, iat, exp
 * @throws {UnauthorizedError} If token is invalid, expired, or wrong type
 * 
 * Validates: Requirements 4.1, 4.2, 4.3, 5.1, 5.5
 */
function verifyToken(token, type) {
  const config = getJWTConfig();
  
  try {
    const decoded = jwt.verify(token, config.secret, {
      algorithms: ['HS256']
    });
    
    // Verify token type matches expected type
    if (decoded.type !== type) {
      throw new UnauthorizedError(`Invalid token type: expected ${type}, got ${decoded.type}`);
    }
    
    return decoded;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token expired');
    }
    
    if (error.name === 'JsonWebTokenError') {
      throw new UnauthorizedError('Invalid token');
    }
    
    throw new UnauthorizedError('Token verification failed');
  }
}

/**
 * Check if a token is blacklisted
 * 
 * @param {string} token - The token to check
 * @returns {Promise<boolean>} True if token is blacklisted, false otherwise
 * 
 * Validates: Requirements 5.6, 7.4
 */
async function isBlacklisted(token) {
  const blacklisted = await BlacklistedToken.findOne({
    where: { token }
  });
  
  return blacklisted !== null;
}

/**
 * Add a token to the blacklist
 * 
 * @param {string} token - The token to blacklist
 * @param {Date} expiresAt - The original expiration time of the token
 * @returns {Promise<void>}
 * 
 * Validates: Requirements 7.1, 7.2, 7.6
 */
async function blacklistToken(token, expiresAt) {
  await BlacklistedToken.create({
    token,
    blacklistedAt: new Date(),
    expiresAt
  });
}

/**
 * Store a refresh token in the database
 * 
 * @param {number} userId - The user ID associated with the token
 * @param {string} token - The refresh token to store
 * @param {Date} expiresAt - The expiration time of the token
 * @returns {Promise<void>}
 * 
 * Validates: Requirements 3.6
 */
async function storeRefreshToken(userId, token, expiresAt) {
  await RefreshToken.create({
    userId,
    token,
    expiresAt
  });
}

/**
 * Verify that a refresh token exists in the database
 * 
 * @param {string} token - The refresh token to verify
 * @returns {Promise<boolean>} True if token exists, false otherwise
 * 
 * Validates: Requirements 5.3
 */
async function verifyRefreshTokenExists(token) {
  const refreshToken = await RefreshToken.findOne({
    where: { token }
  });
  
  return refreshToken !== null;
}

/**
 * Clean up expired tokens from both RefreshToken and BlacklistedToken tables
 * 
 * @returns {Promise<{refreshTokensDeleted: number, blacklistedTokensDeleted: number}>}
 * 
 * Validates: Requirements 11.1, 11.2, 11.3
 */
async function cleanupExpiredTokens() {
  const refreshTokensDeleted = await RefreshToken.cleanup();
  const blacklistedTokensDeleted = await BlacklistedToken.cleanup();
  
  return {
    refreshTokensDeleted,
    blacklistedTokensDeleted
  };
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  isBlacklisted,
  blacklistToken,
  storeRefreshToken,
  verifyRefreshTokenExists,
  cleanupExpiredTokens
};
