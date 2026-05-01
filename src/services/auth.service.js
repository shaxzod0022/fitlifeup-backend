'use strict';

/**
 * Auth Service
 * 
 * Provides user registration, login, token refresh, and logout functionality.
 * 
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 3.1, 3.2, 3.3,
 *            3.4, 3.5, 3.6, 3.7, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 7.1, 7.2, 7.3, 7.6
 */

const { User, Role, Permission, UserProfile } = require('../models');
const passwordService = require('./password.service');
const tokenService = require('./token.service');
const { ConflictError, UnauthorizedError, ValidationError } = require('../utils/errors');

/**
 * Register a new user and return tokens
 * 
 * @param {string} email - User's email address
 * @param {string} password - User's plaintext password
 * @param {object} [profileData] - Optional profile data (firstName, lastName, phone, etc.)
 * @returns {Promise<{accessToken: string, refreshToken: string, userId: number}>}
 */
async function register(email, password, profileData = null) {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }

  // Validate password length
  if (!password || password.length < 4) { // Lowered to 4 for phone-as-password ease
    throw new ValidationError('Password must be at least 4 characters');
  }

  // Check for duplicate email
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new ConflictError('Email already registered');
  }

  // Hash password
  const passwordHash = await passwordService.hash(password);

  // Create user record with default 'user' role
  const userRole = await Role.findOne({ where: { name: 'user' } });
  const user = await User.create({
    email,
    passwordHash,
    roleId: userRole ? userRole.id : null
  });

  // Create profile if data provided
  if (profileData) {
    await UserProfile.create({
      ...profileData,
      userId: user.id,
      email: email // Store email in profile as well as requested
    });
  }

  // Automatically login and return tokens
  return login(email, password);
}

/**
 * Authenticate user and generate access and refresh tokens
 * 
 * @param {string} email - User's email address
 * @param {string} password - User's plaintext password
 * @returns {Promise<{accessToken: string, refreshToken: string, userId: number}>}
 * @throws {UnauthorizedError} If credentials are invalid (generic error)
 * 
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 */
async function login(email, password) {
  // Find user by email with role and permissions
  const user = await User.findOne({ 
    where: { email },
    include: [
      { 
        model: Role, 
        as: 'role',
        include: [{ model: Permission, as: 'permissions' }]
      },
      {
        model: Permission,
        as: 'userPermissions'
      }
    ]
  });
  
  // If user not found, throw generic error (don't reveal which field is wrong)
  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Verify password
  const isValidPassword = await passwordService.verify(password, user.passwordHash);
  
  // If password invalid, throw generic error (don't reveal which field is wrong)
  if (!isValidPassword) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Generate access token (15 minutes)
  const roleName = user.role ? user.role.name : 'user';
  
  // Combine role permissions and direct user permissions
  const rolePerms = user.role && user.role.permissions ? user.role.permissions.map(p => p.slug) : [];
  const userPerms = user.userPermissions ? user.userPermissions.map(p => p.slug) : [];
  const permissions = [...new Set([...rolePerms, ...userPerms])];
  const accessToken = tokenService.generateAccessToken(user.id, roleName, { permissions });

  // Generate refresh token (7 days) and store in database
  const refreshToken = await tokenService.generateRefreshToken(user.id, roleName, { permissions });

  // Return both tokens and userId
  return {
    accessToken,
    refreshToken,
    userId: user.id
  };
}

/**
 * Generate new access token from refresh token
 * 
 * @param {string} refreshToken - The refresh token
 * @returns {Promise<{accessToken: string}>} New access token
 * @throws {UnauthorizedError} If refresh token is invalid, expired, or blacklisted
 * 
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */
async function refresh(refreshToken) {
  // Verify refresh token signature and expiration
  let decoded;
  try {
    decoded = tokenService.verifyToken(refreshToken, 'refresh');
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  // Check if refresh token exists in database
  const exists = await tokenService.verifyRefreshTokenExists(refreshToken);
  if (!exists) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  // Check if refresh token is blacklisted
  const isBlacklisted = await tokenService.isBlacklisted(refreshToken);
  if (isBlacklisted) {
    throw new UnauthorizedError('Token has been revoked');
  }

  // Generate new access token
  const user = await User.findByPk(decoded.userId, {
    include: [{ 
      model: Role, 
      as: 'role',
      include: [{ model: Permission, as: 'permissions' }]
    }]
  });
  const roleName = user && user.role ? user.role.name : 'user';
  const permissions = user && user.role && user.role.permissions ? user.role.permissions.map(p => p.slug) : [];
  const accessToken = tokenService.generateAccessToken(decoded.userId, roleName, { permissions });

  return { accessToken };
}

/**
 * Authenticate user by email only (requested by user for ease of entry)
 * 
 * @param {string} email 
 * @returns {Promise<{accessToken: string, refreshToken: string, userId: number}>}
 */
async function loginByEmail(email) {
  const user = await User.findOne({ 
    where: { email },
    include: [
      { 
        model: Role, 
        as: 'role',
        include: [{ model: Permission, as: 'permissions' }]
      }
    ]
  });
  
  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  const roleName = user.role ? user.role.name : 'user';
  const rolePerms = user.role && user.role.permissions ? user.role.permissions.map(p => p.slug) : [];
  const accessToken = tokenService.generateAccessToken(user.id, roleName, { permissions: rolePerms });
  const refreshToken = await tokenService.generateRefreshToken(user.id, roleName, { permissions: rolePerms });

  return {
    accessToken,
    refreshToken,
    userId: user.id
  };
}

/**
 * Logout user by blacklisting tokens
 */
async function logout(refreshToken, accessToken) {
  // Verify refresh token to get expiration
  let refreshDecoded;
  try {
    refreshDecoded = tokenService.verifyToken(refreshToken, 'refresh');
  } catch (error) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  // Add refresh token to blacklist with timestamp
  const refreshExpiresAt = new Date(refreshDecoded.exp * 1000);
  await tokenService.blacklistToken(refreshToken, refreshExpiresAt);

  // If access token provided, add it to blacklist as well
  if (accessToken) {
    try {
      const accessDecoded = tokenService.verifyToken(accessToken, 'access');
      const accessExpiresAt = new Date(accessDecoded.exp * 1000);
      await tokenService.blacklistToken(accessToken, accessExpiresAt);
    } catch (error) {
      // If access token is invalid, continue (refresh token already blacklisted)
      // Don't throw error for optional access token
    }
  }
}

module.exports = {
  register,
  login,
  loginByEmail,
  refresh,
  logout
};
