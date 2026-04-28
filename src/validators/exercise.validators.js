'use strict';

const { body } = require('express-validator');

/**
 * Валидаторы для создания упражнения (Zanyatie).
 * Validates: Requirements 1.9
 *
 * @type {import('express-validator').ValidationChain[]}
 */
const createExerciseValidators = [
  body('name')
    .notEmpty()
    .withMessage('Поле name обязательно')
    .isString()
    .withMessage('Поле name должно быть строкой'),

  body('visibility')
    .optional()
    .isIn(['public', 'private'])
    .withMessage('Поле visibility должно быть одним из: public, private'),

  body('subtitle').optional().isString().withMessage('Поле subtitle должно быть строкой'),

  body('tags').optional().isArray().withMessage('Поле tags должно быть массивом'),

  body('tags.*').optional().isString().withMessage('Каждый тег должен быть строкой'),

  body('description').optional().isString().withMessage('Поле description должно быть строкой'),

  body('image').optional().isString().withMessage('Поле image должно быть строкой'),

  body('time').optional().isFloat({ min: 0 }).withMessage('Поле time должно быть неотрицательным числом'),
];

/**
 * Валидаторы для обновления упражнения (Zanyatie).
 * Все поля опциональны, но если переданы — должны соответствовать правилам.
 * Validates: Requirements 1.9
 *
 * @type {import('express-validator').ValidationChain[]}
 */
const updateExerciseValidators = [
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

  body('subtitle').optional().isString().withMessage('Поле subtitle должно быть строкой'),

  body('tags').optional().isArray().withMessage('Поле tags должно быть массивом'),

  body('tags.*').optional().isString().withMessage('Каждый тег должен быть строкой'),

  body('description').optional().isString().withMessage('Поле description должно быть строкой'),

  body('image').optional().isString().withMessage('Поле image должно быть строкой'),

  body('time').optional().isFloat({ min: 0 }).withMessage('Поле time должно быть неотрицательным числом'),
];

module.exports = { createExerciseValidators, updateExerciseValidators };
