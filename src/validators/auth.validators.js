'use strict';

const { body } = require('express-validator');

/**
 * Validators for user registration endpoint.
 * Validates: Requirements 1.4, 1.5, 10.6
 *
 * @type {import('express-validator').ValidationChain[]}
 */
const registerValidator = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
    .toLowerCase(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];

/**
 * Validators for user login endpoint.
 * Validates: Requirements 1.4, 10.6
 *
 * @type {import('express-validator').ValidationChain[]}
 */
const loginValidator = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
    .toLowerCase(),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

/**
 * Validators for token refresh endpoint.
 * Validates: Requirements 10.6
 *
 * @type {import('express-validator').ValidationChain[]}
 */
const refreshValidator = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
    .isString()
    .withMessage('Refresh token must be a string'),
];

/**
 * Validators for logout endpoint.
 * Validates: Requirements 10.6
 *
 * @type {import('express-validator').ValidationChain[]}
 */
const logoutValidator = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
    .isString()
    .withMessage('Refresh token must be a string'),

  body('accessToken')
    .optional()
    .isString()
    .withMessage('Access token must be a string'),
];

module.exports = {
  registerValidator,
  loginValidator,
  refreshValidator,
  logoutValidator,
};
