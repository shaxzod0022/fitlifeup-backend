const {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  UnprocessableError,
} = require('../../../src/utils/errors');

describe('AppError', () => {
  it('создаётся с корректными свойствами', () => {
    const err = new AppError('Тестовая ошибка', 500, 'TEST_ERROR');

    expect(err.message).toBe('Тестовая ошибка');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('TEST_ERROR');
    expect(err.details).toEqual([]);
  });

  it('является экземпляром Error и AppError', () => {
    const err = new AppError('Ошибка', 500, 'ERR');

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });

  it('принимает массив details', () => {
    const details = [{ field: 'name', message: 'обязательно' }];
    const err = new AppError('Ошибка', 400, 'ERR', details);

    expect(err.details).toEqual(details);
  });

  it('имеет корректное свойство name', () => {
    const err = new AppError('Ошибка', 500, 'ERR');

    expect(err.name).toBe('AppError');
  });

  it('имеет stack trace', () => {
    const err = new AppError('Ошибка', 500, 'ERR');

    expect(err.stack).toBeDefined();
  });
});

describe('ValidationError', () => {
  it('имеет statusCode 400', () => {
    const err = new ValidationError();

    expect(err.statusCode).toBe(400);
  });

  it('имеет code VALIDATION_ERROR', () => {
    const err = new ValidationError();

    expect(err.code).toBe('VALIDATION_ERROR');
  });

  it('использует дефолтное сообщение', () => {
    const err = new ValidationError();

    expect(err.message).toBeTruthy();
    expect(typeof err.message).toBe('string');
  });

  it('сохраняет кастомное сообщение', () => {
    const err = new ValidationError('Поле name обязательно');

    expect(err.message).toBe('Поле name обязательно');
  });

  it('является экземпляром AppError и Error', () => {
    const err = new ValidationError();

    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
  });

  it('принимает details', () => {
    const details = [{ field: 'email', message: 'некорректный формат' }];
    const err = new ValidationError('Ошибка', details);

    expect(err.details).toEqual(details);
  });
});

describe('UnauthorizedError', () => {
  it('имеет statusCode 401', () => {
    const err = new UnauthorizedError();

    expect(err.statusCode).toBe(401);
  });

  it('имеет code UNAUTHORIZED', () => {
    const err = new UnauthorizedError();

    expect(err.code).toBe('UNAUTHORIZED');
  });

  it('использует дефолтное сообщение', () => {
    const err = new UnauthorizedError();

    expect(err.message).toBeTruthy();
    expect(typeof err.message).toBe('string');
  });

  it('сохраняет кастомное сообщение', () => {
    const err = new UnauthorizedError('Токен истёк');

    expect(err.message).toBe('Токен истёк');
  });

  it('является экземпляром AppError и Error', () => {
    const err = new UnauthorizedError();

    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
  });
});

describe('ForbiddenError', () => {
  it('имеет statusCode 403', () => {
    const err = new ForbiddenError();

    expect(err.statusCode).toBe(403);
  });

  it('имеет code FORBIDDEN', () => {
    const err = new ForbiddenError();

    expect(err.code).toBe('FORBIDDEN');
  });

  it('использует дефолтное сообщение', () => {
    const err = new ForbiddenError();

    expect(err.message).toBeTruthy();
    expect(typeof err.message).toBe('string');
  });

  it('сохраняет кастомное сообщение', () => {
    const err = new ForbiddenError('Нет прав на редактирование');

    expect(err.message).toBe('Нет прав на редактирование');
  });

  it('является экземпляром AppError и Error', () => {
    const err = new ForbiddenError();

    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
  });
});

describe('NotFoundError', () => {
  it('имеет statusCode 404', () => {
    const err = new NotFoundError();

    expect(err.statusCode).toBe(404);
  });

  it('имеет code NOT_FOUND', () => {
    const err = new NotFoundError();

    expect(err.code).toBe('NOT_FOUND');
  });

  it('использует дефолтное сообщение', () => {
    const err = new NotFoundError();

    expect(err.message).toBeTruthy();
    expect(typeof err.message).toBe('string');
  });

  it('сохраняет кастомное сообщение', () => {
    const err = new NotFoundError('Упражнение не найдено');

    expect(err.message).toBe('Упражнение не найдено');
  });

  it('является экземпляром AppError и Error', () => {
    const err = new NotFoundError();

    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
  });
});

describe('ConflictError', () => {
  it('имеет statusCode 409', () => {
    const err = new ConflictError();

    expect(err.statusCode).toBe(409);
  });

  it('имеет code CONFLICT', () => {
    const err = new ConflictError();

    expect(err.code).toBe('CONFLICT');
  });

  it('использует дефолтное сообщение', () => {
    const err = new ConflictError();

    expect(err.message).toBeTruthy();
    expect(typeof err.message).toBe('string');
  });

  it('сохраняет кастомное сообщение', () => {
    const err = new ConflictError('Пользователь уже существует');

    expect(err.message).toBe('Пользователь уже существует');
  });

  it('является экземпляром AppError и Error', () => {
    const err = new ConflictError();

    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
  });
});

describe('UnprocessableError', () => {
  it('имеет statusCode 422', () => {
    const err = new UnprocessableError();

    expect(err.statusCode).toBe(422);
  });

  it('имеет code UNPROCESSABLE_ENTITY', () => {
    const err = new UnprocessableError();

    expect(err.code).toBe('UNPROCESSABLE_ENTITY');
  });

  it('использует дефолтное сообщение', () => {
    const err = new UnprocessableError();

    expect(err.message).toBeTruthy();
    expect(typeof err.message).toBe('string');
  });

  it('сохраняет кастомное сообщение', () => {
    const err = new UnprocessableError('Упражнение недоступно');

    expect(err.message).toBe('Упражнение недоступно');
  });

  it('является экземпляром AppError и Error', () => {
    const err = new UnprocessableError();

    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
  });
});
