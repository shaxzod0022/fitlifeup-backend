'use strict';

// Load environment variables before importing modules
require('dotenv').config();

/**
 * Property-Based Tests for Auth Middleware
 * 
 * Tests universal properties of JWT token validation middleware.
 * 
 * Feature: jwt-authentication
 */

const fc = require('fast-check');
const authMiddleware = require('../../../src/middleware/auth');
const tokenService = require('../../../src/services/token.service');
const { User } = require('../../../src/models/User');
const { sequelize } = require('../../../src/models');

describe('Auth Middleware - Property-Based Tests', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await User.destroy({ where: {}, truncate: true, cascade: true });
  });

  /**
   * Property 23: Middleware Extracts and Validates Token
   * 
   * **Validates: Requirements 6.1, 6.2, 6.3, 9.2**
   * 
   * For any valid access token in the Authorization header (format: "Bearer {token}"),
   * the auth middleware SHALL extract the userId and attach it to req.userId.
   */
  test('Property 23: Middleware extracts and validates token', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // userId generator
        async (userId) => {
          // Generate a valid access token
          const token = tokenService.generateAccessToken(userId);
          
          // Create mock request, response, and next
          const req = {
            headers: {
              authorization: `Bearer ${token}`
            }
          };
          const res = {};
          const next = jest.fn();
          
          // Call middleware
          await authMiddleware(req, res, next);
          
          // Verify userId is attached to request
          expect(req.userId).toBe(userId);
          
          // Verify next() was called without error
          expect(next).toHaveBeenCalledWith();
          expect(next).toHaveBeenCalledTimes(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 24: Invalid Token Signature Rejected
   * 
   * **Validates: Requirements 6.2, 6.6**
   * 
   * For any token with a tampered or invalid signature,
   * the auth middleware SHALL reject it with a 401 authentication error.
   */
  test('Property 24: Invalid token signature rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // userId generator
        async (userId) => {
          // Generate a valid access token
          const validToken = tokenService.generateAccessToken(userId);
          
          // Tamper with the token by modifying the signature
          const parts = validToken.split('.');
          const tamperedSignature = parts[2].split('').reverse().join('');
          const tamperedToken = `${parts[0]}.${parts[1]}.${tamperedSignature}`;
          
          // Create mock request, response, and next
          const req = {
            headers: {
              authorization: `Bearer ${tamperedToken}`
            }
          };
          const res = {};
          const next = jest.fn();
          
          // Call middleware
          await authMiddleware(req, res, next);
          
          // Verify next() was called with an error
          expect(next).toHaveBeenCalledTimes(1);
          const error = next.mock.calls[0][0];
          expect(error).toBeDefined();
          expect(error.statusCode).toBe(401);
          
          // Verify userId is NOT attached to request
          expect(req.userId).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 25: Malformed Authorization Header Rejected
   * 
   * **Validates: Requirements 6.8**
   * 
   * For any Authorization header that does not match the format "Bearer {token}",
   * the auth middleware SHALL reject the request with a 401 error.
   */
  test('Property 25: Malformed authorization header rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant(''),                           // Empty string
          fc.constant('InvalidFormat'),              // No Bearer prefix
          fc.string(),                               // Random string
          fc.constant('Bearer'),                     // Missing token
          fc.constant('Bearer  '),                   // Bearer with spaces only
          fc.tuple(fc.string(), fc.string(), fc.string()).map(
            ([a, b, c]) => `${a} ${b} ${c}`         // Three parts instead of two
          )
        ),
        async (malformedHeader) => {
          // Skip if the header accidentally matches valid format
          if (malformedHeader.startsWith('Bearer ') && malformedHeader.split(' ').length === 2) {
            return; // Skip this case
          }
          
          // Create mock request, response, and next
          const req = {
            headers: {
              authorization: malformedHeader
            }
          };
          const res = {};
          const next = jest.fn();
          
          // Call middleware
          await authMiddleware(req, res, next);
          
          // Verify next() was called with an error
          expect(next).toHaveBeenCalledTimes(1);
          const error = next.mock.calls[0][0];
          expect(error).toBeDefined();
          expect(error.statusCode).toBe(401);
          
          // Verify userId is NOT attached to request
          expect(req.userId).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});
