# Design Document: JWT Authentication System

## Overview

This design document specifies the implementation of a JWT-based authentication system for the fitness tracker REST API. The system replaces the existing stub authentication (X-User-Id header) with a secure, token-based mechanism using access tokens and refresh tokens.

### Key Design Goals

1. **Security**: Implement industry-standard JWT authentication with secure password hashing
2. **Backward Compatibility**: Maintain `req.userId` interface for existing route handlers
3. **Token Management**: Support both short-lived access tokens and long-lived refresh tokens
4. **Revocation**: Enable token blacklisting for logout functionality
5. **Scalability**: Design for efficient token validation and cleanup

### Technology Stack

- **JWT Library**: `jsonwebtoken` (to be added)
- **Password Hashing**: `bcrypt` (to be added)
- **Database**: Sequelize ORM with SQLite
- **Validation**: `express-validator` (existing)
- **Logging**: Winston (existing)

## Architecture

### System Components

```mermaid
graph TB
    Client[Client Application]
    
    subgraph "API Layer"
        AuthRoutes[Auth Routes]
        ProtectedRoutes[Protected Routes]
        AuthMiddleware[Auth Middleware]
    end
    
    subgraph "Business Logic Layer"
        AuthController[Auth Controller]
        AuthService[Auth Service]
        TokenService[Token Service]
        PasswordService[Password Service]
    end
    
    subgraph "Data Layer"
        UserModel[User Model]
        RefreshTokenModel[RefreshToken Model]
        BlacklistedTokenModel[BlacklistedToken Model]
        Database[(SQLite Database)]
    end
    
    Client -->|POST /auth/register| AuthRoutes
    Client -->|POST /auth/login| AuthRoutes
    Client -->|POST /auth/refresh| AuthRoutes
    Client -->|POST /auth/logout| AuthRoutes
    Client -->|GET /api/protected| ProtectedRoutes
    
    ProtectedRoutes --> AuthMiddleware
    AuthMiddleware --> TokenService
    
    AuthRoutes --> AuthController
    AuthController --> AuthService
    AuthService --> TokenService
    AuthService --> PasswordService
    
    AuthService --> UserModel
    TokenService --> RefreshTokenModel
    TokenService --> BlacklistedTokenModel
    
    UserModel --> Database
    RefreshTokenModel --> Database
    BlacklistedTokenModel --> Database
```

### Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant AuthMiddleware
    participant TokenService
    participant Database
    participant RouteHandler
    
    Client->>AuthMiddleware: Request with Bearer token
    AuthMiddleware->>AuthMiddleware: Extract token from header
    AuthMiddleware->>TokenService: Verify token signature
    TokenService->>TokenService: Decode JWT
    TokenService->>Database: Check if blacklisted
    Database-->>TokenService: Not blacklisted
    TokenService-->>AuthMiddleware: Valid token + userId
    AuthMiddleware->>AuthMiddleware: Attach userId to req
    AuthMiddleware->>RouteHandler: Forward request
    RouteHandler-->>Client: Response
```

### Login Flow

```mermaid
sequenceDiagram
    participant Client
    participant AuthController
    participant AuthService
    participant PasswordService
    participant TokenService
    participant Database
    
    Client->>AuthController: POST /auth/login {email, password}
    AuthController->>AuthService: login(email, password)
    AuthService->>Database: Find user by email
    Database-->>AuthService: User record
    AuthService->>PasswordService: verify(password, hash)
    PasswordService-->>AuthService: Valid
    AuthService->>TokenService: generateAccessToken(userId)
    TokenService-->>AuthService: accessToken
    AuthService->>TokenService: generateRefreshToken(userId)
    TokenService->>Database: Store refresh token
    TokenService-->>AuthService: refreshToken
    AuthService-->>AuthController: {accessToken, refreshToken}
    AuthController-->>Client: 200 OK {accessToken, refreshToken}
```

## Components and Interfaces

### 1. User Model

**File**: `src/models/User.js`

**Schema**:
```javascript
{
  id: INTEGER PRIMARY KEY AUTOINCREMENT,
  email: STRING UNIQUE NOT NULL,
  passwordHash: STRING NOT NULL,
  createdAt: DATE,
  updatedAt: DATE
}
```

**Indexes**:
- Unique index on `email`

**Methods**:
- `initUser(sequelize)`: Initialize model with Sequelize instance

**Validations**:
- Email: Valid email format, unique
- PasswordHash: Not null, minimum length

### 2. RefreshToken Model

**File**: `src/models/RefreshToken.js`

**Schema**:
```javascript
{
  id: INTEGER PRIMARY KEY AUTOINCREMENT,
  userId: INTEGER NOT NULL FOREIGN KEY -> User.id,
  token: TEXT NOT NULL,
  expiresAt: DATE NOT NULL,
  createdAt: DATE,
  updatedAt: DATE
}
```

**Indexes**:
- Index on `token` for fast lookup
- Index on `expiresAt` for cleanup queries
- Index on `userId` for user-specific queries

**Associations**:
- `belongsTo(User, { foreignKey: 'userId' })`

**Methods**:
- `initRefreshToken(sequelize)`: Initialize model
- `static async cleanup()`: Remove expired tokens

### 3. BlacklistedToken Model

**File**: `src/models/BlacklistedToken.js`

**Schema**:
```javascript
{
  id: INTEGER PRIMARY KEY AUTOINCREMENT,
  token: TEXT NOT NULL,
  blacklistedAt: DATE NOT NULL,
  expiresAt: DATE NOT NULL,
  createdAt: DATE,
  updatedAt: DATE
}
```

**Indexes**:
- Unique index on `token`
- Index on `expiresAt` for cleanup queries

**Methods**:
- `initBlacklistedToken(sequelize)`: Initialize model
- `static async cleanup()`: Remove expired blacklisted tokens

### 4. Auth Service

**File**: `src/services/auth.service.js`

**Interface**:
```javascript
{
  // Register new user
  async register(email, password): Promise<{ userId: number }>
  
  // Authenticate user and generate tokens
  async login(email, password): Promise<{ 
    accessToken: string, 
    refreshToken: string,
    userId: number 
  }>
  
  // Generate new access token from refresh token
  async refresh(refreshToken): Promise<{ accessToken: string }>
  
  // Revoke tokens
  async logout(refreshToken, accessToken?): Promise<void>
}
```

**Dependencies**:
- TokenService
- PasswordService
- User Model
- RefreshToken Model

**Error Handling**:
- Throws `ConflictError` for duplicate email
- Throws `UnauthorizedError` for invalid credentials
- Throws `ValidationError` for invalid input

### 5. Token Service

**File**: `src/services/token.service.js`

**Interface**:
```javascript
{
  // Generate access token (15 min expiry)
  generateAccessToken(userId: number): string
  
  // Generate refresh token (7 day expiry)
  async generateRefreshToken(userId: number): Promise<string>
  
  // Verify and decode token
  verifyToken(token: string, type: 'access' | 'refresh'): { userId: number, type: string }
  
  // Check if token is blacklisted
  async isBlacklisted(token: string): Promise<boolean>
  
  // Add token to blacklist
  async blacklistToken(token: string, expiresAt: Date): Promise<void>
  
  // Store refresh token in database
  async storeRefreshToken(userId: number, token: string, expiresAt: Date): Promise<void>
  
  // Verify refresh token exists in database
  async verifyRefreshTokenExists(token: string): Promise<boolean>
  
  // Clean up expired tokens
  async cleanupExpiredTokens(): Promise<void>
}
```

**Configuration** (from environment):
- `JWT_SECRET`: Secret key for signing tokens
- `JWT_ACCESS_EXPIRY`: Access token expiration (default: '15m')
- `JWT_REFRESH_EXPIRY`: Refresh token expiration (default: '7d')

**JWT Payload Structure**:
```javascript
// Access Token
{
  userId: number,
  type: 'access',
  iat: number,  // issued at
  exp: number   // expiration
}

// Refresh Token
{
  userId: number,
  type: 'refresh',
  iat: number,
  exp: number
}
```

**Error Handling**:
- Throws `UnauthorizedError` for invalid/expired tokens
- Throws `UnauthorizedError` for blacklisted tokens

### 6. Password Service

**File**: `src/services/password.service.js`

**Interface**:
```javascript
{
  // Hash password with bcrypt
  async hash(password: string): Promise<string>
  
  // Verify password against hash
  async verify(password: string, hash: string): Promise<boolean>
}
```

**Configuration** (from environment):
- `BCRYPT_SALT_ROUNDS`: Salt rounds for bcrypt (default: 10)

**Security**:
- Uses timing-safe comparison
- Generates unique salt per password
- Minimum 10 salt rounds

### 7. Auth Middleware

**File**: `src/middleware/auth.js` (replace existing)

**Interface**:
```javascript
function authMiddleware(req, res, next): void
```

**Behavior**:
1. Extract token from `Authorization: Bearer <token>` header
2. Verify token signature and expiration
3. Check if token is blacklisted
4. Extract userId from token payload
5. Attach userId to `req.userId`
6. Call `next()` to proceed

**Error Responses**:
- 401: Missing token
- 401: Invalid token signature
- 401: Expired token (specific message)
- 401: Blacklisted token

### 8. Auth Controller

**File**: `src/controllers/auth.controller.js` (replace existing)

**Endpoints**:

#### POST /auth/register
```javascript
Request Body:
{
  email: string,      // Valid email format
  password: string    // Min 8 characters
}

Response 201:
{
  userId: number,
  message: string
}

Response 400: Validation error
Response 409: Email already exists
```

#### POST /auth/login
```javascript
Request Body:
{
  email: string,
  password: string
}

Response 200:
{
  accessToken: string,
  refreshToken: string,
  userId: number
}

Response 401: Invalid credentials
```

#### POST /auth/refresh
```javascript
Request Body:
{
  refreshToken: string
}

Response 200:
{
  accessToken: string
}

Response 401: Invalid/expired refresh token
```

#### POST /auth/logout
```javascript
Request Body:
{
  refreshToken: string,
  accessToken?: string  // Optional
}

Response 200:
{
  message: string
}

Response 401: Invalid token
```

### 9. Validators

**File**: `src/validators/auth.validators.js` (new)

**Validation Rules**:
```javascript
{
  registerValidator: [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 })
  ],
  
  loginValidator: [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  
  refreshValidator: [
    body('refreshToken').notEmpty().isString()
  ],
  
  logoutValidator: [
    body('refreshToken').notEmpty().isString(),
    body('accessToken').optional().isString()
  ]
}
```

## Data Models

### Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ RefreshToken : has
    
    User {
        int id PK
        string email UK
        string passwordHash
        datetime createdAt
        datetime updatedAt
    }
    
    RefreshToken {
        int id PK
        int userId FK
        text token
        datetime expiresAt
        datetime createdAt
        datetime updatedAt
    }
    
    BlacklistedToken {
        int id PK
        text token UK
        datetime blacklistedAt
        datetime expiresAt
        datetime createdAt
        datetime updatedAt
    }
```

### Database Migrations

**Migration Strategy**:
1. Create User model and table
2. Create RefreshToken model and table with foreign key to User
3. Create BlacklistedToken model and table
4. Update `src/models/index.js` to initialize new models
5. Run `sequelize.sync()` to create tables

**Backward Compatibility**:
- Existing tables remain unchanged
- No data migration required (fresh authentication system)
- Existing routes continue to work with new auth middleware

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Before defining properties, I need to analyze the acceptance criteria to determine which are suitable for property-based testing.


### Property Reflection

After analyzing all acceptance criteria, I've identified the following redundancies:

**Redundant Properties:**
1. Property 2.2 (store hashed password) is covered by Property 1.3 (password is hashed before storage)
2. Property 4.5 (access token 15min expiry) is covered by Property 3.2
3. Property 4.6 (refresh token 7day expiry) is covered by Property 3.3
4. Property 6.6 (invalid signature error) is covered by Property 6.2
5. Property 9.2 (attach userId to req) is covered by Property 6.3

**Combined Properties:**
1. Properties 4.2 and 4.3 (token claims) can be combined into a single property about token structure
2. Properties 7.1 and 7.6 (blacklist refresh and access tokens) can be combined into a single property about logout blacklisting

**Final Property Set:**
After eliminating redundancy, we have 25 unique, testable properties that provide comprehensive coverage of the authentication system's correctness requirements.

### Property 1: Valid Registration Creates User

*For any* valid email and password combination, registering a user SHALL create a User record in the database with the provided email.

**Validates: Requirements 1.1**

### Property 2: Duplicate Email Registration Fails

*For any* email address, attempting to register a second user with the same email SHALL fail with a conflict error.

**Validates: Requirements 1.2**

### Property 3: Password Hashing Before Storage

*For any* password, the stored passwordHash in the database SHALL be a valid bcrypt hash and SHALL NOT equal the plaintext password.

**Validates: Requirements 1.3, 2.2**

### Property 4: Invalid Email Format Rejected

*For any* string that does not match valid email format, registration SHALL fail with a validation error.

**Validates: Requirements 1.4**

### Property 5: Short Password Rejected

*For any* password with length less than 8 characters, registration SHALL fail with a validation error.

**Validates: Requirements 1.5**

### Property 6: Registration Response Contains User ID

*For any* successful registration, the response SHALL contain a userId field.

**Validates: Requirements 1.6**

### Property 7: Password Hash Never Exposed

*For any* registration request (success or failure), the response SHALL NOT contain the passwordHash field.

**Validates: Requirements 1.7**

### Property 8: Unique Salt Per Password

*For any* password, hashing it twice SHALL produce different hash values due to unique salt generation.

**Validates: Requirements 2.3**

### Property 9: Password Verification Round-Trip

*For any* password, after hashing it, verifying the original password against the hash SHALL return true.

**Validates: Requirements 2.4**

### Property 10: Valid Credentials Authenticate Successfully

*For any* registered user, logging in with the correct email and password SHALL succeed and return tokens.

**Validates: Requirements 3.1**

### Property 11: Access Token Expiration Time

*For any* successful login, the generated access token SHALL have an expiration time approximately 15 minutes from issuance.

**Validates: Requirements 3.2, 4.5**

### Property 12: Refresh Token Expiration Time

*For any* successful login, the generated refresh token SHALL have an expiration time approximately 7 days from issuance.

**Validates: Requirements 3.3, 4.6**

### Property 13: Login Returns Both Tokens

*For any* successful login, the response SHALL contain both accessToken and refreshToken fields.

**Validates: Requirements 3.4**

### Property 14: Invalid Credentials Generic Error

*For any* invalid email/password combination (wrong email, wrong password, or both), login SHALL fail with a generic authentication error that does not reveal which credential was incorrect.

**Validates: Requirements 3.5**

### Property 15: Refresh Token Persisted in Database

*For any* successful login, the generated refresh token SHALL exist in the RefreshToken table with the correct userId and expiresAt timestamp.

**Validates: Requirements 3.6**

### Property 16: User ID in Token Payload

*For any* generated token (access or refresh), decoding the JWT SHALL reveal the userId in the payload.

**Validates: Requirements 3.7**

### Property 17: Token Signature Verification

*For any* generated token, it SHALL be verifiable using the configured JWT secret key.

**Validates: Requirements 4.1**

### Property 18: Token Claims Structure

*For any* generated token, decoding SHALL reveal the required claims: userId, type (access or refresh), iat (issued-at), and exp (expiration).

**Validates: Requirements 4.2, 4.3**

### Property 19: JWT Algorithm HS256

*For any* generated token, the JWT header SHALL specify the algorithm as HS256.

**Validates: Requirements 4.4**

### Property 20: Valid Refresh Token Generates New Access Token

*For any* valid refresh token that is not blacklisted, sending a refresh request SHALL generate and return a new access token.

**Validates: Requirements 5.1, 5.2, 5.4**

### Property 21: Refresh Token Must Exist in Database

*For any* token not stored in the RefreshToken table, attempting to use it for refresh SHALL fail with an authentication error.

**Validates: Requirements 5.3**

### Property 22: Blacklisted Token Rejected for Refresh

*For any* refresh token, after adding it to the blacklist, attempting to use it for refresh SHALL fail with an authentication error.

**Validates: Requirements 5.6, 7.4**

### Property 23: Middleware Extracts and Validates Token

*For any* valid access token in the Authorization header (format: "Bearer {token}"), the auth middleware SHALL extract the userId and attach it to req.userId.

**Validates: Requirements 6.1, 6.2, 6.3, 9.2**

### Property 24: Invalid Token Signature Rejected

*For any* token with a tampered or invalid signature, the auth middleware SHALL reject it with a 401 authentication error.

**Validates: Requirements 6.2, 6.6**

### Property 25: Malformed Authorization Header Rejected

*For any* Authorization header that does not match the format "Bearer {token}", the auth middleware SHALL reject the request with a 401 error.

**Validates: Requirements 6.8**

### Property 26: Logout Blacklists Tokens

*For any* logout request with a refresh token (and optionally an access token), both provided tokens SHALL be added to the BlacklistedToken table.

**Validates: Requirements 7.1, 7.6**

### Property 27: Blacklisted Token Timestamp Recorded

*For any* token added to the blacklist, the BlacklistedToken record SHALL have a blacklistedAt timestamp.

**Validates: Requirements 7.2**

### Property 28: Cleanup Removes Expired Tokens

*For any* token (refresh or blacklisted) with an expiration timestamp in the past, running the cleanup function SHALL remove it from the database.

**Validates: Requirements 11.1, 11.2, 11.3**

## Error Handling

### Error Types and HTTP Status Codes

| Error Scenario | Error Type | HTTP Status | Error Message |
|---------------|------------|-------------|---------------|
| Missing Authorization header | UnauthorizedError | 401 | "Authentication required: No token provided" |
| Invalid token signature | UnauthorizedError | 401 | "Invalid token" |
| Expired access token | UnauthorizedError | 401 | "Token expired" |
| Blacklisted token | UnauthorizedError | 401 | "Token has been revoked" |
| Invalid credentials (login) | UnauthorizedError | 401 | "Invalid credentials" |
| Duplicate email (register) | ConflictError | 409 | "Email already registered" |
| Invalid email format | ValidationError | 400 | "Invalid email format" |
| Password too short | ValidationError | 400 | "Password must be at least 8 characters" |
| Missing required field | ValidationError | 400 | "Field {fieldName} is required" |
| Invalid refresh token | UnauthorizedError | 401 | "Invalid or expired refresh token" |
| Refresh token not in database | UnauthorizedError | 401 | "Invalid refresh token" |

### Error Response Format

All errors follow a consistent JSON structure:

```javascript
{
  error: {
    message: string,      // Human-readable error message
    code: string,         // Error code (e.g., "UNAUTHORIZED", "VALIDATION_ERROR")
    status: number        // HTTP status code
  }
}
```

### Error Handling Strategy

1. **Input Validation**: Use `express-validator` middleware to validate request bodies before processing
2. **Service Layer Errors**: Services throw typed errors (UnauthorizedError, ConflictError, ValidationError)
3. **Controller Layer**: Controllers catch service errors and pass to error handler via `next(error)`
4. **Global Error Handler**: `errorHandler` middleware converts errors to consistent JSON responses
5. **Logging**: All errors logged via Winston with appropriate severity levels
6. **Security**: Never expose sensitive information (password hashes, JWT secrets, stack traces in production)

### Timing Attack Prevention

Password verification uses bcrypt's built-in timing-safe comparison. All authentication failures return the same generic error message with consistent response times to prevent timing attacks that could reveal whether an email exists in the system.

## Testing Strategy

### Testing Approach

This feature requires a **dual testing approach** combining property-based testing and example-based testing:

1. **Property-Based Tests**: Verify universal properties across many generated inputs (100+ iterations per property)
2. **Unit Tests**: Verify specific examples, edge cases, and integration points
3. **Integration Tests**: Verify end-to-end authentication flows with real database

### Property-Based Testing

**Library**: `fast-check` (to be added as dev dependency)

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with: `Feature: jwt-authentication, Property {number}: {property_text}`

**Property Test Coverage**:
- All 28 correctness properties defined above
- Focus on universal behaviors that should hold for all valid inputs
- Use generators for: emails, passwords, user IDs, tokens, timestamps

**Example Property Test Structure**:
```javascript
// Feature: jwt-authentication, Property 3: Password Hashing Before Storage
test('Property 3: Password hashing before storage', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string({ minLength: 8, maxLength: 100 }), // password generator
      async (password) => {
        const hash = await passwordService.hash(password);
        
        // Hash should not equal plaintext
        expect(hash).not.toBe(password);
        
        // Hash should be valid bcrypt format
        expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
        
        // Should verify correctly
        const isValid = await passwordService.verify(password, hash);
        expect(isValid).toBe(true);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing

**Framework**: Jest (existing)

**Coverage Areas**:
1. **Password Service**:
   - Bcrypt configuration (salt rounds)
   - Hash generation
   - Password verification
   - Timing-safe comparison

2. **Token Service**:
   - JWT generation with correct claims
   - Token verification and decoding
   - Blacklist checking
   - Token storage and retrieval
   - Cleanup function

3. **Auth Service**:
   - Registration flow
   - Login flow
   - Refresh flow
   - Logout flow
   - Error handling

4. **Auth Middleware**:
   - Token extraction from header
   - Token validation
   - userId attachment to request
   - Error responses for various failure modes

5. **Validators**:
   - Email format validation
   - Password length validation
   - Required field validation

### Integration Testing

**Test Database**: Separate SQLite database for tests

**Coverage Areas**:
1. **End-to-End Registration**: POST /auth/register → database → response
2. **End-to-End Login**: POST /auth/login → database → tokens
3. **End-to-End Refresh**: POST /auth/refresh → new access token
4. **End-to-End Logout**: POST /auth/logout → blacklist → token rejection
5. **Protected Route Access**: GET /api/protected with valid/invalid tokens
6. **Token Cleanup**: Verify expired tokens are removed

### Test Data Generators

For property-based testing, create generators for:

```javascript
// Email generator (valid formats)
const validEmailGen = fc.emailAddress();

// Email generator (invalid formats)
const invalidEmailGen = fc.oneof(
  fc.string(),  // random strings
  fc.constant('not-an-email'),
  fc.constant('@example.com'),
  fc.constant('user@')
);

// Password generator (valid)
const validPasswordGen = fc.string({ minLength: 8, maxLength: 100 });

// Password generator (invalid - too short)
const shortPasswordGen = fc.string({ maxLength: 7 });

// User ID generator
const userIdGen = fc.integer({ min: 1, max: 1000000 });

// Token generator (for testing blacklist, expiration, etc.)
const tokenGen = fc.string({ minLength: 100, maxLength: 200 });
```

### Test Execution

```bash
# Run all tests
npm test

# Run only unit tests
npm test -- tests/unit

# Run only integration tests
npm test -- tests/integration

# Run only property-based tests
npm test -- --testNamePattern="Property"

# Run with coverage
npm test -- --coverage
```

### Success Criteria

- All 28 property-based tests pass with 100 iterations each
- Unit test coverage > 90% for auth-related code
- Integration tests cover all authentication endpoints
- No security vulnerabilities in authentication flow
- All error cases properly handled and tested

## Security Considerations

### 1. Password Security

**Implementation**:
- Bcrypt with minimum 10 salt rounds (configurable via environment)
- Unique salt per password
- Timing-safe password comparison
- Never log or expose plaintext passwords

**Rationale**: Bcrypt is designed for password hashing with built-in salt generation and computational cost that makes brute-force attacks impractical.

### 2. JWT Secret Management

**Implementation**:
- Secret key stored in environment variable (`JWT_SECRET`)
- Never logged or exposed in responses
- Minimum 32 characters recommended
- Should be rotated periodically (manual process)

**Rationale**: JWT security depends entirely on secret key confidentiality. Environment variables keep secrets out of source code.

### 3. Token Expiration

**Implementation**:
- Access tokens: 15 minutes (short-lived)
- Refresh tokens: 7 days (long-lived)
- Configurable via environment variables

**Rationale**: Short-lived access tokens limit exposure window if compromised. Refresh tokens enable session persistence without storing access tokens.

### 4. Token Revocation

**Implementation**:
- Blacklist table for revoked tokens
- Check blacklist on every token validation
- Cleanup expired blacklisted tokens periodically

**Rationale**: Enables logout functionality and emergency token revocation. Cleanup prevents database bloat.

### 5. Input Validation

**Implementation**:
- Email format validation
- Password length validation (minimum 8 characters)
- Sanitize all inputs before processing
- Use express-validator for consistent validation

**Rationale**: Prevents injection attacks and ensures data integrity.

### 6. Error Message Security

**Implementation**:
- Generic error messages for authentication failures
- Don't reveal whether email exists during login
- Don't expose stack traces in production
- Log detailed errors server-side only

**Rationale**: Prevents information leakage that could aid attackers in enumeration or brute-force attacks.

### 7. Rate Limiting Considerations

**Design Note**: While rate limiting implementation is outside the scope of this feature, the authentication endpoints are designed to support rate limiting middleware:
- Login endpoint: Limit failed attempts per IP/email
- Registration endpoint: Limit registrations per IP
- Refresh endpoint: Limit refresh requests per token

**Recommendation**: Implement rate limiting using `express-rate-limit` in a future enhancement.

### 8. HTTPS Requirement

**Design Note**: JWT tokens should only be transmitted over HTTPS in production. This is an infrastructure concern, not application code, but should be documented in deployment guides.

### 9. Token Storage (Client-Side)

**Design Note**: This is a client responsibility, but documentation should recommend:
- Store access tokens in memory (not localStorage)
- Store refresh tokens in httpOnly cookies or secure storage
- Never expose tokens in URLs or logs

### 10. SQL Injection Prevention

**Implementation**:
- Use Sequelize ORM for all database queries
- Parameterized queries by default
- No raw SQL with user input

**Rationale**: Sequelize automatically parameterizes queries, preventing SQL injection.

## Migration Strategy

### Phase 1: Add New Models and Services (No Breaking Changes)

1. **Add Dependencies**:
   ```bash
   npm install jsonwebtoken bcrypt
   npm install --save-dev fast-check
   ```

2. **Create New Models**:
   - `src/models/User.js`
   - `src/models/RefreshToken.js`
   - `src/models/BlacklistedToken.js`
   - Update `src/models/index.js` to initialize new models

3. **Create Services**:
   - `src/services/password.service.js`
   - `src/services/token.service.js`
   - `src/services/auth.service.js`

4. **Create Validators**:
   - `src/validators/auth.validators.js`

5. **Run Database Sync**:
   - Tables created automatically via `sequelize.sync()`
   - No data migration needed (fresh auth system)

### Phase 2: Replace Auth Endpoints (Breaking Change for Auth Routes)

1. **Update Auth Controller**:
   - Replace stub implementation in `src/controllers/auth.controller.js`
   - Implement: register, login, refresh, logout

2. **Update Auth Routes**:
   - Update `src/routes/auth.routes.js` with new validators
   - Update Swagger documentation

3. **Test Auth Endpoints**:
   - Verify registration, login, refresh, logout work correctly
   - Run integration tests

### Phase 3: Replace Auth Middleware (Breaking Change for Protected Routes)

1. **Update Auth Middleware**:
   - Replace X-User-Id logic in `src/middleware/auth.js`
   - Implement JWT token validation
   - Maintain `req.userId` interface for backward compatibility

2. **Test Protected Routes**:
   - Verify all existing protected routes work with JWT tokens
   - Verify `req.userId` is correctly set
   - Run full integration test suite

3. **Remove X-User-Id Support**:
   - Remove any remaining X-User-Id header handling
   - Update documentation

### Phase 4: Environment Configuration

1. **Add Environment Variables**:
   ```
   JWT_SECRET=<generate-secure-random-string>
   JWT_ACCESS_EXPIRY=15m
   JWT_REFRESH_EXPIRY=7d
   BCRYPT_SALT_ROUNDS=10
   ```

2. **Add Validation**:
   - Verify required environment variables on startup
   - Fail fast with clear error message if missing

### Phase 5: Documentation and Deployment

1. **Update API Documentation**:
   - Document new authentication flow
   - Update Swagger specs
   - Add authentication examples

2. **Update README**:
   - Document environment variables
   - Add authentication setup instructions
   - Include token usage examples

3. **Deploy**:
   - Deploy to staging environment
   - Run smoke tests
   - Deploy to production

### Backward Compatibility Notes

**Breaking Changes**:
- X-User-Id header no longer accepted for authentication
- Clients must use JWT tokens (obtain via /auth/login)
- Registration and login endpoints have new request/response formats

**Non-Breaking Changes**:
- Existing route handlers continue to use `req.userId` (no code changes needed)
- Database schema additions don't affect existing tables
- Error handling structure remains consistent

### Rollback Plan

If issues arise during migration:

1. **Phase 3 Rollback**: Revert auth middleware to X-User-Id version
2. **Phase 2 Rollback**: Revert auth controller to stub version
3. **Phase 1 Rollback**: New models/services don't affect existing functionality

**Database Rollback**: Drop new tables if needed:
```sql
DROP TABLE IF EXISTS BlacklistedTokens;
DROP TABLE IF EXISTS RefreshTokens;
DROP TABLE IF EXISTS Users;
```

## Implementation Checklist

### Dependencies
- [ ] Install `jsonwebtoken`
- [ ] Install `bcrypt`
- [ ] Install `fast-check` (dev dependency)

### Models
- [ ] Create `src/models/User.js`
- [ ] Create `src/models/RefreshToken.js`
- [ ] Create `src/models/BlacklistedToken.js`
- [ ] Update `src/models/index.js` to initialize new models
- [ ] Verify database tables created correctly

### Services
- [ ] Create `src/services/password.service.js`
- [ ] Create `src/services/token.service.js`
- [ ] Create `src/services/auth.service.js`
- [ ] Add unit tests for each service

### Validators
- [ ] Create `src/validators/auth.validators.js`
- [ ] Add validation tests

### Controllers
- [ ] Update `src/controllers/auth.controller.js`
- [ ] Implement register endpoint
- [ ] Implement login endpoint
- [ ] Implement refresh endpoint
- [ ] Implement logout endpoint

### Middleware
- [ ] Update `src/middleware/auth.js`
- [ ] Implement JWT token extraction
- [ ] Implement token validation
- [ ] Implement blacklist checking
- [ ] Maintain `req.userId` interface

### Routes
- [ ] Update `src/routes/auth.routes.js`
- [ ] Add validators to routes
- [ ] Update Swagger documentation

### Testing
- [ ] Write 28 property-based tests (one per correctness property)
- [ ] Write unit tests for services
- [ ] Write unit tests for middleware
- [ ] Write integration tests for auth endpoints
- [ ] Write integration tests for protected routes
- [ ] Verify test coverage > 90%

### Configuration
- [ ] Add environment variable validation
- [ ] Document required environment variables
- [ ] Add default values for optional variables

### Documentation
- [ ] Update README with authentication setup
- [ ] Update API documentation
- [ ] Add authentication examples
- [ ] Document migration steps

### Deployment
- [ ] Test in development environment
- [ ] Test in staging environment
- [ ] Deploy to production
- [ ] Verify authentication works end-to-end

## Appendix: Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes | - | Secret key for signing JWT tokens (min 32 chars recommended) |
| `JWT_ACCESS_EXPIRY` | No | `15m` | Access token expiration time (e.g., '15m', '1h') |
| `JWT_REFRESH_EXPIRY` | No | `7d` | Refresh token expiration time (e.g., '7d', '30d') |
| `BCRYPT_SALT_ROUNDS` | No | `10` | Number of salt rounds for bcrypt (min 10) |

**Example `.env` file**:
```
JWT_SECRET=your-super-secret-key-min-32-characters-long
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
BCRYPT_SALT_ROUNDS=10
```

## Appendix: API Examples

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securepass123"}'

# Response:
{
  "userId": 1,
  "message": "Registration successful"
}
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securepass123"}'

# Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 1
}
```

### Access Protected Route
```bash
curl -X GET http://localhost:3000/api/exercises \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Response: (exercise data)
```

### Refresh Token
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'

# Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'

# Response:
{
  "message": "Logout successful"
}
```
