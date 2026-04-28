'use strict';

/**
 * Environment Configuration and Validation
 * 
 * This module validates required environment variables on application startup
 * and provides default values for optional configuration.
 * 
 * Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5
 */

const logger = require('../utils/logger');

/**
 * Validates time duration format (e.g., '15m', '7d', '1h')
 * @param {string} duration - Duration string to validate
 * @returns {boolean} True if valid format
 */
function isValidDurationFormat(duration) {
  // Valid formats: number followed by s (seconds), m (minutes), h (hours), d (days)
  const durationRegex = /^\d+[smhd]$/;
  return durationRegex.test(duration);
}

/**
 * Validates that required environment variables are present
 * @throws {Error} If required environment variables are missing
 */
function validateEnvironment() {
  const requiredVars = ['JWT_SECRET'];
  const missing = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    const errorMessage = `Missing required environment variables: ${missing.join(', ')}. Please check .env.example for required configuration.`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  // Validate JWT_SECRET length (minimum 32 characters required)
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    const errorMessage = 'JWT_SECRET must be at least 32 characters long';
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  // Validate JWT_ACCESS_EXPIRY format if provided
  if (process.env.JWT_ACCESS_EXPIRY && !isValidDurationFormat(process.env.JWT_ACCESS_EXPIRY)) {
    const errorMessage = 'JWT_ACCESS_EXPIRY must have valid format (e.g., "15m", "1h")';
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  // Validate JWT_REFRESH_EXPIRY format if provided
  if (process.env.JWT_REFRESH_EXPIRY && !isValidDurationFormat(process.env.JWT_REFRESH_EXPIRY)) {
    const errorMessage = 'JWT_REFRESH_EXPIRY must have valid format (e.g., "7d", "30d")';
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  // Validate BCRYPT_SALT_ROUNDS if provided
  if (process.env.BCRYPT_SALT_ROUNDS) {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10);
    if (isNaN(saltRounds) || saltRounds < 10) {
      const errorMessage = 'BCRYPT_SALT_ROUNDS must be a number >= 10';
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  logger.info('Environment variables validated successfully');
  logConfiguration();
}

/**
 * Logs configuration values on startup (without exposing secrets)
 * Validates: Requirement 12.5
 */
function logConfiguration() {
  const config = {
    JWT_SECRET: '***REDACTED***',
    JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
    JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
    BCRYPT_SALT_ROUNDS: process.env.BCRYPT_SALT_ROUNDS || '10',
    PORT: process.env.PORT || '3000'
  };

  logger.info('Application configuration:', config);
}

/**
 * Gets the JWT configuration from environment variables
 * @returns {Object} JWT configuration object
 */
function getJWTConfig() {
  return {
    secret: process.env.JWT_SECRET,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d'
  };
}

/**
 * Gets the bcrypt configuration from environment variables
 * @returns {Object} Bcrypt configuration object
 */
function getBcryptConfig() {
  return {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10)
  };
}

module.exports = {
  validateEnvironment,
  getJWTConfig,
  getBcryptConfig
};
