const { body, validationResult } = require('express-validator');
const validate = require('../../../src/middleware/validate');

/**
 * Вспомогательная функция для создания mock req/res/next
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

describe('validate middleware', () => {
  it('вызывает next() без аргументов при успешной валидации', async () => {
    const { req, res, next } = createMocks({ name: 'Test' });
    const middleware = validate([body('name').notEmpty()]);

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('возвращает 400 с VALIDATION_ERROR при ошибке валидации', async () => {
    const { req, res, next } = createMocks({ name: '' });
    const middleware = validate([body('name').notEmpty().withMessage('Поле name обязательно')]);

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: expect.any(String),
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'name',
              message: 'Поле name обязательно',
            }),
          ]),
        }),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('возвращает все ошибки при нескольких нарушениях валидации', async () => {
    const { req, res, next } = createMocks({});
    const middleware = validate([
      body('name').notEmpty().withMessage('name обязательно'),
      body('email').isEmail().withMessage('email невалиден'),
    ]);

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.error.details.length).toBeGreaterThanOrEqual(2);
  });

  it('принимает пустой массив валидаторов и вызывает next()', async () => {
    const { req, res, next } = createMocks({ anything: 'value' });
    const middleware = validate([]);

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });
});
