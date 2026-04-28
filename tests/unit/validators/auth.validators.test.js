const { body } = require('express-validator');
const {
  registerValidator,
  loginValidator,
  refreshValidator,
  logoutValidator,
} = require('../../../src/validators/auth.validators');
const validate = require('../../../src/middleware/validate');

/**
 * Helper function to create mock req/res/next
 */
function createMocks(body = {}, params = {}, query = {}) {
  const req = { body, params, query, headers: {} };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('Auth Validators', () => {
  describe('registerValidator', () => {
    it('should pass validation with valid email and password', async () => {
      const { req, res, next } = createMocks({
        email: 'test@example.com',
        password: 'password123',
      });
      const middleware = validate(registerValidator);

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should normalize email to lowercase', async () => {
      const { req, res, next } = createMocks({
        email: 'Test@Example.COM',
        password: 'password123',
      });
      const middleware = validate(registerValidator);

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.body.email).toBe('test@example.com');
    });

    it('should fail validation when email is missing', async () => {
      const { req, res, next } = createMocks({
        password: 'password123',
      });
      const middleware = validate(registerValidator);

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            details: expect.arrayContaining([
              expect.objectContaining({
                field: 'email',
                message: 'Email is required',
              }),
            ]),
          }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail validation when email format is invalid', async () => {
      const { req, res, next } = createMocks({
        email: 'not-an-email',
        password: 'password123',
      });
      const middleware = validate(registerValidator);

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            details: expect.arrayContaining([
              expect.objectContaining({
                field: 'email',
                message: 'Invalid email format',
              }),
            ]),
          }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail validation when password is missing', async () => {
      const { req, res, next } = createMocks({
        email: 'test@example.com',
      });
      const middleware = validate(registerValidator);

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            details: expect.arrayContaining([
              expect.objectContaining({
                field: 'password',
                message: 'Password is required',
              }),
            ]),
          }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail validation when password is less than 8 characters', async () => {
      const { req, res, next } = createMocks({
        email: 'test@example.com',
        password: 'short',
      });
      const middleware = validate(registerValidator);

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            details: expect.arrayContaining([
              expect.objectContaining({
                field: 'password',
                message: 'Password must be at least 8 characters',
              }),
            ]),
          }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail validation with multiple errors', async () => {
      const { req, res, next } = createMocks({
        email: 'invalid-email',
        password: 'short',
      });
      const middleware = validate(registerValidator);

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      const jsonArg = res.json.mock.calls[0][0];
      expect(jsonArg.error.details.length).toBeGreaterThanOrEqual(2);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('loginValidator', () => {
    it('should pass validation with valid email and password', async () => {
      const { req, res, next } = createMocks({
        email: 'test@example.com',
        password: 'anypassword',
      });
      const middleware = validate(loginValidator);

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should normalize email to lowercase', async () => {
      const { req, res, next } = createMocks({
        email: 'Test@Example.COM',
        password: 'anypassword',
      });
      const middleware = validate(loginValidator);

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.body.email).toBe('test@example.com');
    });

    it('should fail validation when email is missing', async () => {
      const { req, res, next } = createMocks({
        password: 'anypassword',
      });
      const middleware = validate(loginValidator);

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            details: expect.arrayContaining([
              expect.objectContaining({
                field: 'email',
                message: 'Email is required',
              }),
            ]),
          }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail validation when email format is invalid', async () => {
      const { req, res, next } = createMocks({
        email: 'not-an-email',
        password: 'anypassword',
      });
      const middleware = validate(loginValidator);

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            details: expect.arrayContaining([
              expect.objectContaining({
                field: 'email',
                message: 'Invalid email format',
              }),
            ]),
          }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail validation when password is missing', async () => {
      const { req, res, next } = createMocks({
        email: 'test@example.com',
      });
      const middleware = validate(loginValidator);

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            details: expect.arrayContaining([
              expect.objectContaining({
                field: 'password',
                message: 'Password is required',
              }),
            ]),
          }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should accept any non-empty password (no length requirement)', async () => {
      const { req, res, next } = createMocks({
        email: 'test@example.com',
        password: 'x',
      });
      const middleware = validate(loginValidator);

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('refreshValidator', () => {
    it('should pass validation with valid refresh token', async () => {
      const { req, res, next } = createMocks({
        refreshToken: 'valid.jwt.token',
      });
      const middleware = validate(refreshValidator);

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should fail validation when refreshToken is missing', async () => {
      const { req, res, next } = createMocks({});
      const middleware = validate(refreshValidator);

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            details: expect.arrayContaining([
              expect.objectContaining({
                field: 'refreshToken',
                message: 'Refresh token is required',
              }),
            ]),
          }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail validation when refreshToken is empty string', async () => {
      const { req, res, next } = createMocks({
        refreshToken: '',
      });
      const middleware = validate(refreshValidator);

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            details: expect.arrayContaining([
              expect.objectContaining({
                field: 'refreshToken',
                message: 'Refresh token is required',
              }),
            ]),
          }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail validation when refreshToken is not a string', async () => {
      const { req, res, next } = createMocks({
        refreshToken: 12345,
      });
      const middleware = validate(refreshValidator);

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            details: expect.arrayContaining([
              expect.objectContaining({
                field: 'refreshToken',
                message: 'Refresh token must be a string',
              }),
            ]),
          }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('logoutValidator', () => {
    it('should pass validation with refreshToken only', async () => {
      const { req, res, next } = createMocks({
        refreshToken: 'valid.jwt.token',
      });
      const middleware = validate(logoutValidator);

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should pass validation with both refreshToken and accessToken', async () => {
      const { req, res, next } = createMocks({
        refreshToken: 'valid.refresh.token',
        accessToken: 'valid.access.token',
      });
      const middleware = validate(logoutValidator);

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should fail validation when refreshToken is missing', async () => {
      const { req, res, next } = createMocks({
        accessToken: 'valid.access.token',
      });
      const middleware = validate(logoutValidator);

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            details: expect.arrayContaining([
              expect.objectContaining({
                field: 'refreshToken',
                message: 'Refresh token is required',
              }),
            ]),
          }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail validation when refreshToken is empty string', async () => {
      const { req, res, next } = createMocks({
        refreshToken: '',
      });
      const middleware = validate(logoutValidator);

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            details: expect.arrayContaining([
              expect.objectContaining({
                field: 'refreshToken',
                message: 'Refresh token is required',
              }),
            ]),
          }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail validation when refreshToken is not a string', async () => {
      const { req, res, next } = createMocks({
        refreshToken: 12345,
      });
      const middleware = validate(logoutValidator);

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            details: expect.arrayContaining([
              expect.objectContaining({
                field: 'refreshToken',
                message: 'Refresh token must be a string',
              }),
            ]),
          }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail validation when accessToken is provided but not a string', async () => {
      const { req, res, next } = createMocks({
        refreshToken: 'valid.refresh.token',
        accessToken: 12345,
      });
      const middleware = validate(logoutValidator);

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            details: expect.arrayContaining([
              expect.objectContaining({
                field: 'accessToken',
                message: 'Access token must be a string',
              }),
            ]),
          }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should pass validation when accessToken is omitted (optional)', async () => {
      const { req, res, next } = createMocks({
        refreshToken: 'valid.refresh.token',
      });
      const middleware = validate(logoutValidator);

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
