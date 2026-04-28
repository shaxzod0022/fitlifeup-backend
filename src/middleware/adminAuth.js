'use strict';

const { UnauthorizedError } = require('../utils/errors');
const authMiddleware = require('./auth');

/**
 * Middleware to check if the authenticated user has the 'admin' role.
 * Must be used AFTER authMiddleware.
 */
function requireAdmin(req, res, next) {
  if (!req.userRole || req.userRole !== 'admin') {
    return next(new UnauthorizedError('Access denied: Admin privileges required'));
  }
  next();
}

module.exports = requireAdmin;
