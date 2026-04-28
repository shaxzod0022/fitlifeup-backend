'use strict';

const { body } = require('express-validator');

/**
 * Валидаторы для создания блюда (Blyudo).
 * Validates: Requirements 5.7
 *
 * @type {import('express-validator').ValidationChain[]}
 */
const createDishValidators = [
  body('name')
    .notEmpty()
    .withMessage('Поле name обязательно')
    .isString()
    .withMessage('Поле name должно быть строкой'),

  body('visibility')
    .optional()
    .isIn(['public', 'private'])
    .withMessage('Поле visibility должно быть одним из: public, private'),

  body('description').optional().isString().withMessage('Поле description должно быть строкой'),

  body('image').optional().isString().withMessage('Поле image должно быть строкой'),

  body('tags').optional().isArray().withMessage('Поле tags должно быть массивом'),

  body('tags.*').optional().isString().withMessage('Каждый тег должен быть строкой'),

  body('protein')
    .optional({ nullable: true })
    .custom((value) => value === null || typeof value === 'number')
    .withMessage('Поле protein должно быть числом или null')
    .if((value) => value !== null)
    .isFloat()
    .withMessage('Поле protein должно быть числом'),

  body('carbohydrate')
    .optional({ nullable: true })
    .custom((value) => value === null || typeof value === 'number')
    .withMessage('Поле carbohydrate должно быть числом или null')
    .if((value) => value !== null)
    .isFloat()
    .withMessage('Поле carbohydrate должно быть числом'),

  body('fat')
    .optional({ nullable: true })
    .custom((value) => value === null || typeof value === 'number')
    .withMessage('Поле fat должно быть числом или null')
    .if((value) => value !== null)
    .isFloat()
    .withMessage('Поле fat должно быть числом'),
];

/**
 * Валидаторы для обновления блюда (Blyudo).
 * Все поля опциональны, но если переданы — должны соответствовать правилам.
 * Validates: Requirements 5.7
 *
 * @type {import('express-validator').ValidationChain[]}
 */
const updateDishValidators = [
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

  body('description').optional().isString().withMessage('Поле description должно быть строкой'),

  body('image').optional().isString().withMessage('Поле image должно быть строкой'),

  body('tags').optional().isArray().withMessage('Поле tags должно быть массивом'),

  body('tags.*').optional().isString().withMessage('Каждый тег должен быть строкой'),

  body('protein')
    .optional({ nullable: true })
    .custom((value) => value === null || typeof value === 'number')
    .withMessage('Поле protein должно быть числом или null')
    .if((value) => value !== null)
    .isFloat()
    .withMessage('Поле protein должно быть числом'),

  body('carbohydrate')
    .optional({ nullable: true })
    .custom((value) => value === null || typeof value === 'number')
    .withMessage('Поле carbohydrate должно быть числом или null')
    .if((value) => value !== null)
    .isFloat()
    .withMessage('Поле carbohydrate должно быть числом'),

  body('fat')
    .optional({ nullable: true })
    .custom((value) => value === null || typeof value === 'number')
    .withMessage('Поле fat должно быть числом или null')
    .if((value) => value !== null)
    .isFloat()
    .withMessage('Поле fat должно быть числом'),
];

module.exports = { createDishValidators, updateDishValidators };
