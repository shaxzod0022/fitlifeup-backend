'use strict';

const { body } = require('express-validator');

/**
 * Валидаторы для создания сета (Set).
 * Validates: Requirements 2.9
 *
 * @type {import('express-validator').ValidationChain[]}
 */
const createSetValidators = [
  body('name')
    .notEmpty()
    .withMessage('Поле name обязательно')
    .isString()
    .withMessage('Поле name должно быть строкой'),

  body('visibility')
    .optional()
    .isIn(['public', 'private'])
    .withMessage('Поле visibility должно быть одним из: public, private'),

  body('tags').optional().isArray().withMessage('Поле tags должно быть массивом'),

  body('tags.*').optional().isString().withMessage('Каждый тег должен быть строкой'),

  body('level').optional().isString().withMessage('Поле level должно быть строкой'),

  body('items')
    .optional()
    .isArray()
    .withMessage('Поле items должно быть массивом'),

  body('items.*.exerciseId')
    .if(body('items').exists())
    .optional()
    .isUUID()
    .withMessage('Поле items[].exerciseId должно быть UUID'),

  body('items.*.name')
    .if(body('items').exists())
    .notEmpty()
    .withMessage('Поле items[].name обязательно')
    .isString()
    .withMessage('Поле items[].name должно быть строкой'),

  body('items.*.subtitle')
    .if(body('items').exists())
    .optional()
    .isString()
    .withMessage('Поле items[].subtitle должно быть строкой'),

  body('items.*.image')
    .if(body('items').exists())
    .optional()
    .isString()
    .withMessage('Поле items[].image должно быть строкой'),

  body('items.*.time')
    .if(body('items').exists())
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Поле items[].time должно быть числом >= 0'),

  body('items.*.count')
    .if(body('items').exists())
    .optional()
    .isInt({ min: 1 })
    .withMessage('Поле items[].count должно быть целым числом >= 1'),

  body('items.*.break')
    .if(body('items').exists())
    .optional()
    .isInt({ min: 0 })
    .withMessage('Поле items[].break должно быть целым числом >= 0'),

  body('items.*.repeats')
    .if(body('items').exists())
    .optional()
    .isInt({ min: 1 })
    .withMessage('Поле items[].repeats должно быть целым числом >= 1'),
];

/**
 * Валидаторы для обновления сета (Set).
 * Все поля опциональны, но если переданы — должны соответствовать правилам.
 * Validates: Requirements 2.9
 *
 * @type {import('express-validator').ValidationChain[]}
 */
const updateSetValidators = [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Поле name не может быть пустым')
    .isString()
    .withMessage('Поле name должно быть строкой'),

  body('visibility')
    .optional()
    .isIn(['public', 'private'])
    .withMessage('Поле visibility должно быть одним из: public, private'),

  body('tags').optional().isArray().withMessage('Поле tags должно быть массивом'),

  body('tags.*').optional().isString().withMessage('Каждый тег должен быть строкой'),

  body('level').optional().isString().withMessage('Поле level должно быть строкой'),

  body('items')
    .optional()
    .isArray()
    .withMessage('Поле items должно быть массивом'),

  body('items.*.exerciseId')
    .if(body('items').exists())
    .optional()
    .isUUID()
    .withMessage('Поле items[].exerciseId должно быть UUID'),

  body('items.*.name')
    .if(body('items').exists())
    .optional()
    .isString()
    .withMessage('Поле items[].name должно быть строкой'),

  body('items.*.subtitle')
    .if(body('items').exists())
    .optional()
    .isString()
    .withMessage('Поле items[].subtitle должно быть строкой'),

  body('items.*.image')
    .if(body('items').exists())
    .optional()
    .isString()
    .withMessage('Поле items[].image должно быть строкой'),

  body('items.*.time')
    .if(body('items').exists())
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Поле items[].time должно быть числом >= 0'),

  body('items.*.count')
    .if(body('items').exists())
    .optional()
    .isInt({ min: 1 })
    .withMessage('Поле items[].count должно быть целым числом >= 1'),

  body('items.*.break')
    .if(body('items').exists())
    .optional()
    .isInt({ min: 0 })
    .withMessage('Поле items[].break должно быть целым числом >= 0'),

  body('items.*.repeats')
    .if(body('items').exists())
    .optional()
    .isInt({ min: 1 })
    .withMessage('Поле items[].repeats должно быть целым числом >= 1'),
];

module.exports = { createSetValidators, updateSetValidators };
