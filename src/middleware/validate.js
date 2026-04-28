const { validationResult } = require('express-validator');

/**
 * Запускает цепочку валидаторов express-validator.
 * При наличии ошибок возвращает 400 с массивом нарушений.
 *
 * @param {import('express-validator').ValidationChain[]} validations - массив правил валидации
 * @returns {import('express').RequestHandler} middleware-функция
 *
 * Validates: Requirements 10.2
 */
function validate(validations) {
  return async (req, res, next) => {
    // Запускаем все цепочки валидации параллельно
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Ошибка валидации входных данных',
          details: errors.array().map((err) => ({
            field: err.path || err.param,
            message: err.msg,
          })),
        },
      });
    }

    next();
  };
}

module.exports = validate;
