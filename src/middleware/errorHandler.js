const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Глобальный обработчик ошибок Express.
 * Преобразует любую ошибку в стандартный JSON-формат:
 * { error: { code, message, details } }
 *
 * - Если ошибка является AppError — использует её statusCode, code, message, details.
 * - Если ошибка неизвестна — возвращает 500 с общим сообщением, не раскрывая деталей.
 * - Все 500-ошибки логируются с полным стек-трейсом через winston.
 *
 * Validates: Requirements 10.1, 10.5, 10.6
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    const statusCode = err.statusCode;

    // Логируем 500-ошибки с полным стек-трейсом
    if (statusCode >= 500) {
      logger.error(err.message, { stack: err.stack, code: err.code });
    }

    return res.status(statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details || [],
      },
    });
  }

  // Неизвестная ошибка — логируем и возвращаем 500
  logger.error('Необработанная внутренняя ошибка', { stack: err.stack, message: err.message });

  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Внутренняя ошибка сервера',
      details: [],
    },
  });
}

module.exports = errorHandler;
