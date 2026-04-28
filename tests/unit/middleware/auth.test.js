'use strict';

// Load environment variables before importing modules
require('dotenv').config();

/**
 * Unit Tests for Auth Middleware
 * 
 * Tests specific examples and edge cases for JWT token validation middleware.
 * 
 * Validates: Requirements 6.1, 6.5, 6.7, 9.2, 10.1, 10.2, 10.3
 */

const authMiddleware = require('../../../src/middleware/auth');
const tokenService = require('../../../src/services/token.service');
const { UnauthorizedError } = require('../../../src/utils/errors');
const { sequelize } = require('../../../src/models');

describe('Auth Middleware - Unit Tests', () => {
  let req, res, next;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(() => {
    req = { headers: {} };
    res = {};
    next = jest.fn();
  });

  describe('Missing Authorization header', () => {
    it('returns 401 error when Authorization header is missing', async () => {
      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Authentication required: No token provided');
    });

    it('does not attach userId to request when header is missing', async () => {
      await authMiddleware(req, res, next);

      expect(req.userId).toBeUndefined();
    });
  });

  describe('Malformed Authorization header', () => {
    it('returns 401 error when Authorization header does not start with Bearer', async () => {
      req.headers.authorization = 'InvalidFormat token123';

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Invalid authorization header format');
    });

    it('returns 401 error when Authorization header has only Bearer without token', async () => {
      req.headers.authorization = 'Bearer';

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.statusCode).toBe(401);
    });

    it('returns 401 error when Authorization header has multiple spaces', async () => {
      req.headers.authorization = 'Bearer token1 token2';

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.statusCode).toBe(401);
    });
  });

  describe('Valid token handling', () => {
    it('attaches userId to req and calls next() when token is valid', async () => {
      const userId = 42;
      const token = tokenService.generateAccessToken(userId);
      req.headers.authorization = `Bearer ${token}`;

      await authMiddleware(req, res, next);

      expect(req.userId).toBe(userId);
      expect(next).toHaveBeenCalledWith(); // Called without arguments
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('correctly extracts userId from token payload', async () => {
      const userId = 12345;
      const token = tokenService.generateAccessToken(userId);
      req.headers.authorization = `Bearer ${token}`;

      await authMiddleware(req, res, next);

      expect(req.userId).toBe(userId);
    });
  });

  describe('Invalid token signature', () => {
    it('returns 401 error when token signature is invalid', async () => {
      const validToken = tokenService.generateAccessToken(1);
      const parts = validToken.split('.');
      const tamperedToken = `${parts[0]}.${parts[1]}.invalidsignature`;
      req.headers.authorization = `Bearer ${tamperedToken}`;

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Invalid token');
    });

    it('does not attach userId when token signature is invalid', async () => {
      req.headers.authorization = 'Bearer invalid.token.signature';

      await authMiddleware(req, res, next);

      expect(req.userId).toBeUndefined();
    });
  });

  describe('Expired token handling', () => {
    it('returns 401 error with "Token expired" message for expired tokens', async () => {
      // Create a token that expires immediately
      const jwt = require('jsonwebtoken');
      const { getJWTConfig } = require('../../../src/config/env');
      const config = getJWTConfig();
      
      const expiredToken = jwt.sign(
        { userId: 1, type: 'access' },
        config.secret,
        { expiresIn: '0s', algorithm: 'HS256' }
      );

      req.headers.authorization = `Bearer ${expiredToken}`;

      // Wait a moment to ensure token is expired
      await new Promise(resolve => setTimeout(resolve, 100));

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Token expired');
    });
  });

  describe('Blacklisted token rejection', () => {
    it('returns 401 error when token is blacklisted', async () => {
      const userId = 99;
      const token = tokenService.generateAccessToken(userId);
      
      // Blacklist the token
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(token);
      const expiresAt = new Date(decoded.exp * 1000);
      await tokenService.blacklistToken(token, expiresAt);

      req.headers.authorization = `Bearer ${token}`;

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Token has been revoked');
    });

    it('does not attach userId when token is blacklisted', async () => {
      const userId = 88;
      const token = tokenService.generateAccessToken(userId);
      
      // Blacklist the token
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(token);
      const expiresAt = new Date(decoded.exp * 1000);
      await tokenService.blacklistToken(token, expiresAt);

      req.headers.authorization = `Bearer ${token}`;

      await authMiddleware(req, res, next);

      expect(req.userId).toBeUndefined();
    });
  });

  describe('req.userId attachment', () => {
    it('maintains backward compatibility by attaching userId to req.userId', async () => {
      const userId = 777;
      const token = tokenService.generateAccessToken(userId);
      req.headers.authorization = `Bearer ${token}`;

      await authMiddleware(req, res, next);

      // Verify the exact property name for backward compatibility
      expect(req).toHaveProperty('userId');
      expect(req.userId).toBe(userId);
    });
  });

  describe('Error responses', () => {
    it('passes UnauthorizedError to next() for authentication failures', async () => {
      req.headers.authorization = 'Bearer invalid.token';

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(UnauthorizedError);
    });

    it('returns 401 status code for all authentication errors', async () => {
      const testCases = [
        { headers: {} }, // Missing header
        { headers: { authorization: 'InvalidFormat' } }, // Malformed header
        { headers: { authorization: 'Bearer invalid.token' } } // Invalid token
      ];

      for (const testCase of testCases) {
        const testReq = { headers: testCase.headers };
        const testNext = jest.fn();

        await authMiddleware(testReq, res, testNext);

        const error = testNext.mock.calls[0][0];
        expect(error.statusCode).toBe(401);
      }
    });
  });
});
