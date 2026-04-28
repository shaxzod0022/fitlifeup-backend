const errorHandler = require('../../../src/middleware/errorHandler');
const {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} = require('../../../src/utils/errors');

// Мокаем logger, чтобы не писать в файл во время тестов
jest.mock('../../../src/utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
}));

const logger = require('../../../src/utils/logger');

function createMocks() {
  const req = {};
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('errorHandler middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('обрабатывает ValidationError и возвращает 400', () => {
    const { req, res, next } = createMocks();
    const err = new ValidationError('Ошибка валидации', [{ field: 'name', message: 'обязательно' }]);

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Ошибка валидации',
        details: [{ field: 'name', message: 'обязательно' }],
      },
    });
  });

  it('обрабатывает UnauthorizedError и возвращает 401', () => {
    const { req, res, next } = createMocks();
    const err = new UnauthorizedError();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'UNAUTHORIZED' }),
      })
    );
  });

  it('обрабатывает ForbiddenError и возвращает 403', () => {
    const { req, res, next } = createMocks();
    const err = new ForbiddenError();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'FORBIDDEN' }),
      })
    );
  });

  it('обрабатывает NotFoundError и возвращает 404', () => {
    const { req, res, next } = createMocks();
    const err = new NotFoundError('Ресурс не найден');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'NOT_FOUND' }),
      })
    );
  });

  it('обрабатывает ConflictError и возвращает 409', () => {
    const { req, res, next } = createMocks();
    const err = new ConflictError();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('обрабатывает AppError с кодом 500 и логирует ошибку', () => {
    const { req, res, next } = createMocks();
    const err = new AppError('Критическая ошибка', 500, 'CRITICAL_ERROR');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(logger.error).toHaveBeenCalled();
  });

  it('обрабатывает неизвестную ошибку и возвращает 500 с INTERNAL_SERVER_ERROR', () => {
    const { req, res, next } = createMocks();
    const err = new Error('Что-то пошло не так');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Внутренняя ошибка сервера',
        details: [],
      },
    });
  });

  it('логирует неизвестную ошибку через logger.error', () => {
    const { req, res, next } = createMocks();
    const err = new Error('Неизвестная ошибка');

    errorHandler(err, req, res, next);

    expect(logger.error).toHaveBeenCalled();
  });

  it('не раскрывает детали реализации при неизвестной ошибке', () => {
    const { req, res, next } = createMocks();
    const err = new Error('Секретная внутренняя ошибка');

    errorHandler(err, req, res, next);

    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.error.message).not.toContain('Секретная');
    expect(jsonArg.error.details).toEqual([]);
  });

  it('ответ содержит поля code, message, details для AppError', () => {
    const { req, res, next } = createMocks();
    const err = new NotFoundError('Упражнение не найдено', [{ id: '123' }]);

    errorHandler(err, req, res, next);

    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.error).toHaveProperty('code');
    expect(jsonArg.error).toHaveProperty('message');
    expect(jsonArg.error).toHaveProperty('details');
  });
});
