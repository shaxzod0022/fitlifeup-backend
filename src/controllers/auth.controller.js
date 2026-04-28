'use strict';

/**
 * Auth Controller
 * 
 * Handles authentication endpoints: register, login, refresh, logout
 * 
 * Validates: Requirements 1.1, 1.2, 1.6, 3.1, 3.4, 5.1, 5.4, 7.1, 7.3,
 *            9.3, 9.4, 10.1, 10.4, 10.5, 10.6
 */

const authService = require('../services/auth.service');

/**
 * POST /auth/register
 * Register a new user with email and password
 * 
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 * 
 * Validates: Requirements 1.1, 1.2, 1.6, 9.3, 10.5, 10.6
 */
async function register(req, res, next) {
  try {
    const { email, password } = req.body;
    
    // Call auth service to register user
    const result = await authService.register(email, password);
    
    // Return 201 with userId and success message
    res.status(201).json({
      userId: result.userId,
      message: 'User registered successfully'
    });
  } catch (err) {
    // Pass errors to error handler (handles ConflictError 409, ValidationError 400)
    next(err);
  }
}

/**
 * POST /auth/login
 * Authenticate user and return access and refresh tokens
 * 
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 * 
 * Validates: Requirements 3.1, 3.4, 9.4, 10.1, 10.4
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    
    // Call auth service to authenticate user
    const result = await authService.login(email, password);
    
    // Return 200 with accessToken, refreshToken, and userId
    res.status(200).json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      userId: result.userId
    });
  } catch (err) {
    // Pass errors to error handler (handles UnauthorizedError 401)
    next(err);
  }
}

/**
 * POST /auth/refresh
 * Generate new access token from refresh token
 * 
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 * 
 * Validates: Requirements 5.1, 5.4, 10.1, 10.2
 */
async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    
    // Call auth service to refresh token
    const result = await authService.refresh(refreshToken);
    
    // Return 200 with new accessToken
    res.status(200).json({
      accessToken: result.accessToken
    });
  } catch (err) {
    // Pass errors to error handler (handles UnauthorizedError 401)
    next(err);
  }
}

/**
 * POST /auth/logout
 * Logout user by blacklisting tokens
 * 
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 * 
 * Validates: Requirements 7.1, 7.3, 10.1
 */
async function logout(req, res, next) {
  try {
    const { refreshToken, accessToken } = req.body;
    
    // Call auth service to logout (blacklist tokens)
    await authService.logout(refreshToken, accessToken);
    
    // Return 200 with success message
    res.status(200).json({
      message: 'Logged out successfully'
    });
  } catch (err) {
    // Pass errors to error handler (handles UnauthorizedError 401)
    next(err);
  }
}

/**
 * GET /auth/me
 * Get current authenticated user details (role and permissions)
 */
async function me(req, res, next) {
  try {
    res.status(200).json({
      userId: req.userId,
      role: req.userRole,
      permissions: req.userPermissions
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  me
};
