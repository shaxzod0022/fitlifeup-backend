'use strict';

const { body } = require('express-validator');

const FITNESS_GOAL_VALUES = ['weight_loss', 'muscle_gain', 'weight_maintenance', 'rehabilitation'];
const WORKOUT_FREQUENCY_VALUES = ['low', 'medium', 'high'];

/**
 * Валидаторы для создания профиля пользователя (UserProfile).
 * Все поля опциональны.
 * Validates: Requirements 8.2, 8.3, 8.7
 *
 * @type {import('express-validator').ValidationChain[]}
 */
const createProfileValidators = [
  body('name').optional().isString().withMessage('Поле name должно быть строкой'),

  body('phone').optional().isString().withMessage('Поле phone должно быть строкой'),

  body('gender').optional().isString().withMessage('Поле gender должно быть строкой'),

  body('age')
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage('Поле age должно быть целым неотрицательным числом'),

  body('height')
    .optional({ nullable: true })
    .isFloat({ gt: 0 })
    .withMessage('Поле height должно быть положительным числом (см)'),

  body('weight')
    .optional({ nullable: true })
    .isFloat({ gt: 0 })
    .withMessage('Поле weight должно быть положительным числом (кг)'),

  body('fitnessGoal')
    .optional({ nullable: true })
    .isIn(FITNESS_GOAL_VALUES)
    .withMessage(
      `Поле fitnessGoal должно быть одним из: ${FITNESS_GOAL_VALUES.join(', ')}`
    ),

  body('workoutFrequency')
    .optional({ nullable: true })
    .isIn(WORKOUT_FREQUENCY_VALUES)
    .withMessage(
      `Поле workoutFrequency должно быть одним из: ${WORKOUT_FREQUENCY_VALUES.join(', ')}`
    ),
];

/**
 * Валидаторы для обновления профиля пользователя (UserProfile).
 * Все поля опциональны, правила те же, что и при создании.
 * Validates: Requirements 8.2, 8.3, 8.7
 *
 * @type {import('express-validator').ValidationChain[]}
 */
const updateProfileValidators = [
  body('name').optional().isString().withMessage('Поле name должно быть строкой'),

  body('phone').optional().isString().withMessage('Поле phone должно быть строкой'),

  body('gender').optional().isString().withMessage('Поле gender должно быть строкой'),

  body('age')
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage('Поле age должно быть целым неотрицательным числом'),

  body('height')
    .optional({ nullable: true })
    .isFloat({ gt: 0 })
    .withMessage('Поле height должно быть положительным числом (см)'),

  body('weight')
    .optional({ nullable: true })
    .isFloat({ gt: 0 })
    .withMessage('Поле weight должно быть положительным числом (кг)'),

  body('fitnessGoal')
    .optional({ nullable: true })
    .isIn(FITNESS_GOAL_VALUES)
    .withMessage(
      `Поле fitnessGoal должно быть одним из: ${FITNESS_GOAL_VALUES.join(', ')}`
    ),

  body('workoutFrequency')
    .optional({ nullable: true })
    .isIn(WORKOUT_FREQUENCY_VALUES)
    .withMessage(
      `Поле workoutFrequency должно быть одним из: ${WORKOUT_FREQUENCY_VALUES.join(', ')}`
    ),
];

module.exports = { createProfileValidators, updateProfileValidators };
