/**
 * Базовый класс для всех кастомных ошибок приложения.
 * Содержит: message, statusCode, code (строковый идентификатор), details (массив).
 */
class AppError extends Error {
  /**
   * @param {string} message - Сообщение об ошибке
   * @param {number} statusCode - HTTP-статус
   * @param {string} code - Строковый код ошибки
   * @param {Array} [details=[]] - Дополнительные детали ошибки
   */
  constructor(message, statusCode, code, details = []) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Ошибка валидации входных данных — 400 Bad Request.
 */
class ValidationError extends AppError {
  constructor(message = 'Ошибка валидации входных данных', details = []) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * Ошибка аутентификации — 401 Unauthorized.
 */
class UnauthorizedError extends AppError {
  constructor(message = 'Требуется аутентификация', details = []) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

/**
 * Ошибка доступа — 403 Forbidden.
 */
class ForbiddenError extends AppError {
  constructor(message = 'Доступ запрещён', details = []) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

/**
 * Ресурс не найден — 404 Not Found.
 */
class NotFoundError extends AppError {
  constructor(message = 'Ресурс не найден', details = []) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

/**
 * Конфликт уникальности — 409 Conflict.
 */
class ConflictError extends AppError {
  constructor(message = 'Конфликт: ресурс уже существует', details = []) {
    super(message, 409, 'CONFLICT', details);
  }
}

/**
 * Необрабатываемая сущность — 422 Unprocessable Entity.
 */
class UnprocessableError extends AppError {
  constructor(message = 'Невозможно обработать запрос', details = []) {
    super(message, 422, 'UNPROCESSABLE_ENTITY', details);
  }
}

module.exports = {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  UnprocessableError,
};
