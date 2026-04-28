'use strict';

/**
 * Auth Middleware
 * 
 * Validates JWT tokens from Authorization header and attaches userId to request.
 * 
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.7, 6.8, 9.1, 9.2, 10.1, 10.2, 10.3
 */

const { UnauthorizedError } = require('../utils/errors');
const tokenService = require('../services/token.service');

/**
 * Middleware to authenticate requests using JWT tokens
 * 
 * Extracts token from Authorization header (format: "Bearer {token}"),
 * verifies token signature and expiration, checks if blacklisted,
 * and attaches userId to req.userId for backward compatibility.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.7, 6.8, 9.1, 9.2
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    // Check if Authorization header is present
    if (!authHeader) {
      return next(new UnauthorizedError('Authentication required: No token provided'));
    }
    
    // Validate Authorization header format: "Bearer {token}"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next(new UnauthorizedError('Invalid authorization header format'));
    }
    
    const token = parts[1];
    
    
    // Verify token signature and expiration
    const decoded = tokenService.verifyToken(token, 'access');
    
    // Validate that userId exists in token payload
    if (!decoded.userId) {
      return next(new UnauthorizedError('Invalid token: missing user identifier'));
    }
    
    // Check if token is blacklisted
    const isBlacklisted = await tokenService.isBlacklisted(token);
    if (isBlacklisted) {
      return next(new UnauthorizedError('Token has been revoked'));
    }
    
    // Extract userId and role from token payload and attach to request
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    
    // Proceed to route handler
    next();
  } catch (error) {
    // Pass authentication errors to error handler
    if (error instanceof UnauthorizedError) {
      return next(error);
    }
    
    // Handle unexpected errors
    return next(new UnauthorizedError('Authentication failed'));
  }
}

module.exports = authMiddleware;
