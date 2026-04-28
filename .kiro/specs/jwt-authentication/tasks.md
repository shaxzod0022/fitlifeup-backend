# Implementation Plan: JWT Authentication System

## Overview

This implementation plan converts the JWT authentication system design into actionable coding tasks. The implementation follows a phased approach: first establishing the data layer (models), then building the business logic layer (services), followed by the API layer (controllers, middleware, validators), and finally adding comprehensive testing. Each task builds incrementally on previous work, with checkpoints to ensure stability before proceeding.

The implementation replaces the existing stub authentication (X-User-Id header) with a secure JWT-based system using access tokens (15-minute expiry) and refresh tokens (7-day expiry). The system maintains backward compatibility by preserving the `req.userId` interface used by existing route handlers.

## Tasks

- [x] 1. Install dependencies and configure environment
  - Install `jsonwebtoken` and `bcrypt` for authentication
  - Install `fast-check` as dev dependency for property-based testing
  - Create `.env.example` file documenting required environment variables
  - Add environment variable validation on application startup
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 2. Create User model and database schema
  - [x] 2.1 Create User model with Sequelize
    - Create `src/models/User.js` with schema: id, email (unique), passwordHash, timestamps
    - Add unique index on email field
    - Add email format validation at model level
    - Export `User` model and `initUser` initialization function
    - _Requirements: 8.1, 8.4_
  
  - [x] 2.2 Write property test for User model
    - **Property 1: Valid Registration Creates User**
    - **Validates: Requirements 1.1**
    - Test that valid email/password creates User record in database
  
  - [x] 2.3 Write unit tests for User model
    - Test email uniqueness constraint
    - Test email format validation
    - Test required fields validation
    - _Requirements: 8.1, 8.4_

- [x] 3. Create RefreshToken and BlacklistedToken models
  - [x] 3.1 Create RefreshToken model
    - Create `src/models/RefreshToken.js` with schema: id, userId (FK), token, expiresAt, timestamps
    - Add indexes on token, expiresAt, and userId fields
    - Add foreign key relationship to User model
    - Implement static `cleanup()` method to remove expired tokens
    - _Requirements: 8.2, 8.5, 8.6, 11.1, 11.3_
  
  - [x] 3.2 Create BlacklistedToken model
    - Create `src/models/BlacklistedToken.js` with schema: id, token (unique), blacklistedAt, expiresAt, timestamps
    - Add unique index on token field
    - Add index on expiresAt field
    - Implement static `cleanup()` method to remove expired blacklisted tokens
    - _Requirements: 8.3, 8.5, 8.6, 11.2, 11.3_
  
  - [x] 3.3 Update models index to initialize new models
    - Import and initialize User, RefreshToken, and BlacklistedToken models in `src/models/index.js`
    - Define association: RefreshToken belongsTo User
    - Export all new models
    - Run application to verify tables are created via `sequelize.sync()`
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [x] 3.4 Write unit tests for token models
    - Test RefreshToken foreign key relationship
    - Test BlacklistedToken unique constraint on token
    - Test cleanup methods remove expired records
    - _Requirements: 8.2, 8.3, 11.1, 11.2, 11.3_

- [x] 4. Checkpoint - Verify database models
  - Ensure all tests pass, verify database tables created correctly, ask the user if questions arise.

- [-] 5. Implement Password Service
  - [x] 5.1 Create password hashing and verification service
    - Create `src/services/password.service.js`
    - Implement `hash(password)` function using bcrypt with configurable salt rounds (default 10)
    - Implement `verify(password, hash)` function using bcrypt's timing-safe comparison
    - Read `BCRYPT_SALT_ROUNDS` from environment with default value of 10
    - _Requirements: 2.1, 2.3, 2.4, 12.4, 13.5_
  
  - [x] 5.2 Write property test for password hashing
    - **Property 3: Password Hashing Before Storage**
    - **Validates: Requirements 1.3, 2.2**
    - Test that hashed password never equals plaintext and is valid bcrypt format
  
  - [x] 5.3 Write property test for unique salt generation
    - **Property 8: Unique Salt Per Password**
    - **Validates: Requirements 2.3**
    - Test that hashing same password twice produces different hashes
  
  - [x] 5.4 Write property test for password verification round-trip
    - **Property 9: Password Verification Round-Trip**
    - **Validates: Requirements 2.4**
    - Test that any password can be hashed and then verified successfully
  
  - [x] 5.5 Write unit tests for Password Service
    - Test bcrypt salt rounds configuration
    - Test hash format validation
    - Test verification with incorrect password returns false
    - _Requirements: 2.1, 2.4_

- [-] 6. Implement Token Service
  - [x] 6.1 Create JWT token generation and verification service
    - Create `src/services/token.service.js`
    - Implement `generateAccessToken(userId)` - creates JWT with type='access', 15min expiry
    - Implement `generateRefreshToken(userId)` - creates JWT with type='refresh', 7day expiry, stores in database
    - Implement `verifyToken(token, type)` - verifies signature, expiration, returns decoded payload
    - Read JWT_SECRET, JWT_ACCESS_EXPIRY (default '15m'), JWT_REFRESH_EXPIRY (default '7d') from environment
    - Use HS256 algorithm for JWT signing
    - Include claims: userId, type, iat, exp in all tokens
    - _Requirements: 3.2, 3.3, 3.7, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 12.1, 12.2, 12.3_
  
  - [x] 6.2 Implement token blacklist and storage functions
    - Implement `isBlacklisted(token)` - checks if token exists in BlacklistedToken table
    - Implement `blacklistToken(token, expiresAt)` - adds token to BlacklistedToken table with timestamp
    - Implement `storeRefreshToken(userId, token, expiresAt)` - saves refresh token to RefreshToken table
    - Implement `verifyRefreshTokenExists(token)` - checks if refresh token exists in database
    - Implement `cleanupExpiredTokens()` - calls cleanup methods on both token models
    - _Requirements: 3.6, 5.3, 7.1, 7.2, 7.4, 7.5, 7.6, 11.1, 11.2, 11.3_
  
  - [x] 6.3 Write property test for token signature verification
    - **Property 17: Token Signature Verification**
    - **Validates: Requirements 4.1**
    - Test that any generated token is verifiable with the JWT secret
  
  - [x] 6.4 Write property test for token claims structure
    - **Property 18: Token Claims Structure**
    - **Validates: Requirements 4.2, 4.3**
    - Test that decoded tokens contain userId, type, iat, and exp claims
  
  - [x] 6.5 Write property test for JWT algorithm
    - **Property 19: JWT Algorithm HS256**
    - **Validates: Requirements 4.4**
    - Test that JWT header specifies HS256 algorithm
  
  - [x] 6.6 Write property test for access token expiration
    - **Property 11: Access Token Expiration Time**
    - **Validates: Requirements 3.2, 4.5**
    - Test that access tokens expire approximately 15 minutes from issuance
  
  - [x] 6.7 Write property test for refresh token expiration
    - **Property 12: Refresh Token Expiration Time**
    - **Validates: Requirements 3.3, 4.6**
    - Test that refresh tokens expire approximately 7 days from issuance
  
  - [x] 6.8 Write property test for user ID in token payload
    - **Property 16: User ID in Token Payload**
    - **Validates: Requirements 3.7**
    - Test that decoding any token reveals userId in payload
  
  - [x] 6.9 Write property test for refresh token persistence
    - **Property 15: Refresh Token Persisted in Database**
    - **Validates: Requirements 3.6**
    - Test that generated refresh tokens exist in RefreshToken table
  
  - [x] 6.10 Write property test for blacklisted token rejection
    - **Property 22: Blacklisted Token Rejected for Refresh**
    - **Validates: Requirements 5.6, 7.4**
    - Test that blacklisted tokens fail authentication
  
  - [x] 6.11 Write property test for cleanup removes expired tokens
    - **Property 28: Cleanup Removes Expired Tokens**
    - **Validates: Requirements 11.1, 11.2, 11.3**
    - Test that cleanup function removes tokens with past expiration timestamps
  
  - [x] 6.12 Write unit tests for Token Service
    - Test token generation with custom expiry times
    - Test token verification with invalid signature
    - Test token verification with expired token
    - Test blacklist checking performance
    - Test database storage and retrieval
    - _Requirements: 4.1, 5.1, 5.5, 7.4_

- [x] 7. Checkpoint - Verify core services
  - Ensure all tests pass, verify token generation and verification work correctly, ask the user if questions arise.

- [x] 8. Implement Auth Service
  - [x] 8.1 Create user registration functionality
    - Create `src/services/auth.service.js`
    - Implement `register(email, password)` function
    - Validate email format and password length (min 8 chars)
    - Check for duplicate email, throw ConflictError if exists
    - Hash password using Password Service
    - Create User record in database
    - Return userId
    - Never return passwordHash in response
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_
  
  - [x] 8.2 Create user login functionality
    - Implement `login(email, password)` function in Auth Service
    - Find user by email
    - Verify password using Password Service
    - Generate access token and refresh token using Token Service
    - Store refresh token in database
    - Return accessToken, refreshToken, and userId
    - Throw generic UnauthorizedError for invalid credentials (don't reveal which field is wrong)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_
  
  - [x] 8.3 Create token refresh functionality
    - Implement `refresh(refreshToken)` function in Auth Service
    - Verify refresh token signature and expiration using Token Service
    - Check if refresh token exists in database
    - Check if refresh token is blacklisted
    - Generate new access token
    - Return new accessToken
    - Throw UnauthorizedError for invalid/expired/blacklisted tokens
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [x] 8.4 Create logout functionality
    - Implement `logout(refreshToken, accessToken?)` function in Auth Service
    - Add refresh token to blacklist with timestamp
    - If access token provided, add it to blacklist as well
    - Record blacklist timestamp
    - Return success
    - _Requirements: 7.1, 7.2, 7.3, 7.6_
  
  - [x] 8.5 Write property test for valid registration creates user
    - **Property 1: Valid Registration Creates User**
    - **Validates: Requirements 1.1**
    - Test that valid email/password creates User record
  
  - [x] 8.6 Write property test for duplicate email rejection
    - **Property 2: Duplicate Email Registration Fails**
    - **Validates: Requirements 1.2**
    - Test that registering same email twice fails with conflict error
  
  - [x] 8.7 Write property test for invalid email format rejection
    - **Property 4: Invalid Email Format Rejected**
    - **Validates: Requirements 1.4**
    - Test that invalid email formats fail validation
  
  - [x] 8.8 Write property test for short password rejection
    - **Property 5: Short Password Rejected**
    - **Validates: Requirements 1.5**
    - Test that passwords under 8 characters fail validation
  
  - [x] 8.9 Write property test for registration response contains user ID
    - **Property 6: Registration Response Contains User ID**
    - **Validates: Requirements 1.6**
    - Test that successful registration returns userId
  
  - [x] 8.10 Write property test for password hash never exposed
    - **Property 7: Password Hash Never Exposed**
    - **Validates: Requirements 1.7**
    - Test that registration responses never contain passwordHash
  
  - [x] 8.11 Write property test for valid credentials authenticate
    - **Property 10: Valid Credentials Authenticate Successfully**
    - **Validates: Requirements 3.1**
    - Test that correct email/password returns tokens
  
  - [x] 8.12 Write property test for login returns both tokens
    - **Property 13: Login Returns Both Tokens**
    - **Validates: Requirements 3.4**
    - Test that login response contains accessToken and refreshToken
  
  - [x] 8.13 Write property test for invalid credentials generic error
    - **Property 14: Invalid Credentials Generic Error**
    - **Validates: Requirements 3.5**
    - Test that wrong email/password returns generic error without revealing which is incorrect
  
  - [x] 8.14 Write property test for valid refresh token generates new access token
    - **Property 20: Valid Refresh Token Generates New Access Token**
    - **Validates: Requirements 5.1, 5.2, 5.4**
    - Test that valid refresh token returns new access token
  
  - [x] 8.15 Write property test for refresh token must exist in database
    - **Property 21: Refresh Token Must Exist in Database**
    - **Validates: Requirements 5.3**
    - Test that tokens not in database fail refresh
  
  - [x] 8.16 Write property test for logout blacklists tokens
    - **Property 26: Logout Blacklists Tokens**
    - **Validates: Requirements 7.1, 7.6**
    - Test that logout adds tokens to blacklist
  
  - [x] 8.17 Write property test for blacklist timestamp recorded
    - **Property 27: Blacklisted Token Timestamp Recorded**
    - **Validates: Requirements 7.2**
    - Test that blacklisted tokens have blacklistedAt timestamp
  
  - [x] 8.18 Write unit tests for Auth Service
    - Test registration with various invalid inputs
    - Test login with non-existent user
    - Test refresh with tampered token
    - Test logout with invalid token
    - Test error handling and logging
    - _Requirements: 1.1, 3.1, 5.1, 7.1, 10.1, 10.4, 10.5, 10.7_

- [x] 9. Create authentication validators
  - [x] 9.1 Create validation rules for auth endpoints
    - Create `src/validators/auth.validators.js`
    - Implement `registerValidator` - validate email format and password length (min 8)
    - Implement `loginValidator` - validate email format and password presence
    - Implement `refreshValidator` - validate refreshToken is non-empty string
    - Implement `logoutValidator` - validate refreshToken required, accessToken optional
    - Use express-validator for all validation rules
    - Normalize email addresses (lowercase, trim)
    - _Requirements: 1.4, 1.5, 10.6_
  
  - [x] 9.2 Write unit tests for validators
    - Test each validator with valid and invalid inputs
    - Test email normalization
    - Test validation error messages
    - _Requirements: 1.4, 1.5, 10.6_

- [x] 10. Checkpoint - Verify business logic layer
  - Ensure all tests pass, verify registration, login, refresh, and logout work correctly, ask the user if questions arise.

- [x] 11. Update Auth Controller
  - [x] 11.1 Implement registration endpoint
    - Update `src/controllers/auth.controller.js`
    - Replace stub `register` function with real implementation
    - Call `authService.register(email, password)`
    - Return 201 status with userId and success message
    - Handle ConflictError (409) for duplicate email
    - Handle ValidationError (400) for invalid input
    - Pass errors to error handler via `next(error)`
    - _Requirements: 1.1, 1.2, 1.6, 9.3, 10.5, 10.6_
  
  - [x] 11.2 Implement login endpoint
    - Replace stub `login` function with real implementation
    - Call `authService.login(email, password)`
    - Return 200 status with accessToken, refreshToken, and userId
    - Handle UnauthorizedError (401) for invalid credentials
    - Pass errors to error handler via `next(error)`
    - _Requirements: 3.1, 3.4, 9.4, 10.1, 10.4_
  
  - [x] 11.3 Implement refresh endpoint
    - Add new `refresh` function to controller
    - Call `authService.refresh(refreshToken)`
    - Return 200 status with new accessToken
    - Handle UnauthorizedError (401) for invalid/expired tokens
    - Pass errors to error handler via `next(error)`
    - _Requirements: 5.1, 5.4, 10.1, 10.2_
  
  - [x] 11.4 Implement logout endpoint
    - Add new `logout` function to controller
    - Call `authService.logout(refreshToken, accessToken)`
    - Return 200 status with success message
    - Handle UnauthorizedError (401) for invalid tokens
    - Pass errors to error handler via `next(error)`
    - _Requirements: 7.1, 7.3, 10.1_
  
  - [x] 11.5 Write integration tests for auth endpoints
    - Test POST /auth/register with valid and invalid data
    - Test POST /auth/login with valid and invalid credentials
    - Test POST /auth/refresh with valid and invalid tokens
    - Test POST /auth/logout with valid and invalid tokens
    - Test error response formats
    - _Requirements: 1.1, 3.1, 5.1, 7.1, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 12. Replace Auth Middleware
  - [x] 12.1 Implement JWT token validation middleware
    - Update `src/middleware/auth.js` to replace X-User-Id logic
    - Extract token from Authorization header (format: "Bearer {token}")
    - Verify token signature and expiration using Token Service
    - Check if token is blacklisted
    - Extract userId from token payload
    - Attach userId to `req.userId` (maintain backward compatibility)
    - Call `next()` to proceed to route handler
    - Return 401 for missing token
    - Return 401 for invalid signature
    - Return 401 with "Token expired" message for expired tokens
    - Return 401 for blacklisted tokens
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.7, 6.8, 9.1, 9.2, 10.1, 10.2, 10.3_
  
  - [x] 12.2 Write property test for middleware extracts and validates token
    - **Property 23: Middleware Extracts and Validates Token**
    - **Validates: Requirements 6.1, 6.2, 6.3, 9.2**
    - Test that valid Bearer token results in userId attached to req
  
  - [x] 12.3 Write property test for invalid token signature rejected
    - **Property 24: Invalid Token Signature Rejected**
    - **Validates: Requirements 6.2, 6.6**
    - Test that tampered tokens are rejected with 401
  
  - [x] 12.4 Write property test for malformed authorization header rejected
    - **Property 25: Malformed Authorization Header Rejected**
    - **Validates: Requirements 6.8**
    - Test that non-Bearer format headers are rejected
  
  - [x] 12.5 Write unit tests for Auth Middleware
    - Test missing Authorization header
    - Test expired token handling
    - Test blacklisted token rejection
    - Test req.userId attachment
    - Test error responses
    - _Requirements: 6.1, 6.5, 6.7, 9.2, 10.1, 10.2, 10.3_

- [x] 13. Update auth routes and remove X-User-Id support
  - [x] 13.1 Update auth routes with validators
    - Update `src/routes/auth.routes.js`
    - Add `registerValidator` to POST /auth/register route
    - Add `loginValidator` to POST /auth/login route
    - Add `refreshValidator` to POST /auth/refresh route
    - Add `logoutValidator` to POST /auth/logout route
    - Add validation error handling middleware
    - _Requirements: 1.4, 1.5, 9.3, 9.4_
  
  - [x] 13.2 Remove X-User-Id header support
    - Verify no remaining X-User-Id header handling in auth middleware
    - Remove any X-User-Id documentation or comments
    - _Requirements: 9.5_
  
  - [x] 13.3 Write integration tests for protected routes
    - Test that existing protected routes work with JWT tokens
    - Test that req.userId is correctly set for all protected routes
    - Test that requests without tokens are rejected
    - Test that requests with invalid tokens are rejected
    - _Requirements: 6.1, 6.3, 6.4, 9.1, 9.2_

- [x] 14. Checkpoint - Verify API layer integration
  - Ensure all tests pass, verify all endpoints work with JWT authentication, ask the user if questions arise.

- [x] 15. Add environment configuration and validation
  - [x] 15.1 Create environment configuration validation
    - Add startup validation for required environment variables
    - Check JWT_SECRET is present and at least 32 characters
    - Check JWT_ACCESS_EXPIRY has valid format (default '15m')
    - Check JWT_REFRESH_EXPIRY has valid format (default '7d')
    - Check BCRYPT_SALT_ROUNDS is a number >= 10 (default 10)
    - Fail fast with clear error message if validation fails
    - Log configuration values on startup (without exposing secrets)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 13.1_
  
  - [x] 15.2 Create .env.example file
    - Document all required environment variables
    - Provide example values (not real secrets)
    - Include descriptions for each variable
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  
  - [x] 15.3 Write unit tests for environment validation
    - Test validation with missing JWT_SECRET
    - Test validation with short JWT_SECRET
    - Test validation with invalid expiry formats
    - Test validation with invalid salt rounds
    - _Requirements: 12.5_

- [x] 16. Update API documentation
  - [x] 16.1 Update Swagger/OpenAPI documentation
    - Update `src/config/swagger.js` or relevant Swagger config
    - Document POST /auth/register endpoint with request/response schemas
    - Document POST /auth/login endpoint with request/response schemas
    - Document POST /auth/refresh endpoint with request/response schemas
    - Document POST /auth/logout endpoint with request/response schemas
    - Document Bearer token authentication scheme
    - Add security requirement to all protected endpoints
    - Include example requests and responses
    - Document all error responses (400, 401, 409)
  
  - [x] 16.2 Update README with authentication setup
    - Add section on JWT authentication
    - Document environment variables required
    - Provide setup instructions for new developers
    - Include example API calls with curl
    - Document token usage patterns
    - Add troubleshooting section for common auth issues

- [x] 17. Security audit and logging
  - [x] 17.1 Verify security best practices
    - Verify JWT_SECRET is never logged or exposed in responses
    - Verify plaintext passwords are never logged
    - Verify all inputs are validated and sanitized
    - Verify timing-safe password comparison is used
    - Verify error messages don't leak sensitive information
    - Verify all authentication errors are logged with appropriate severity
    - _Requirements: 10.7, 13.1, 13.2, 13.3_
  
  - [x] 17.2 Write security-focused integration tests
    - Test that JWT_SECRET is not exposed in any response
    - Test that passwords are not logged
    - Test that error messages are generic for authentication failures
    - Test SQL injection prevention via Sequelize
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [x] 18. Final checkpoint and deployment preparation
  - Ensure all tests pass (unit, property-based, integration)
  - Verify test coverage > 90% for auth-related code
  - Run full test suite including existing tests to ensure no regressions
  - Verify all 28 property-based tests pass with 100 iterations each
  - Test authentication flow end-to-end in development environment
  - Ask the user if ready to proceed with deployment or if any issues need addressing

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Property-based tests validate universal correctness properties (28 total)
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end authentication flows
- Checkpoints ensure incremental validation and stability
- The implementation maintains backward compatibility with existing route handlers via `req.userId`
- All authentication errors are logged without exposing sensitive information
- Token cleanup functions are implemented but scheduling is outside scope (can be added later with cron jobs)

## Testing Summary

**Property-Based Tests**: 28 properties covering all universal behaviors
- Password hashing and verification (4 properties)
- Token generation and validation (11 properties)
- Registration and login flows (7 properties)
- Token refresh and logout (3 properties)
- Middleware authentication (3 properties)

**Unit Tests**: Covering specific examples and edge cases
- Model validation and constraints
- Service layer error handling
- Validator rules and error messages
- Middleware token extraction and validation

**Integration Tests**: End-to-end authentication flows
- Registration → Login → Access Protected Route
- Login → Refresh Token → New Access Token
- Login → Logout → Token Rejection
- Invalid credentials and error responses

**Success Criteria**:
- All 28 property-based tests pass with 100 iterations each
- Unit test coverage > 90% for auth-related code
- All integration tests pass
- No security vulnerabilities in authentication flow
- Backward compatibility maintained with existing routes
