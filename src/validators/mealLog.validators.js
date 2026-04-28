'use strict';

const { body } = require('express-validator');

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'afternoon_snack', 'evening_snack', 'custom'];

/**
 * Валидаторы для создания записи о приёме пищи (MealLog).
 * Validates: Requirements 6.1, 6.2
 *
 * @type {import('express-validator').ValidationChain[]}
 */
const createMealLogValidators = [
  body('date')
    .notEmpty()
    .withMessage('Поле date обязательно')
    .isDate({ format: 'YYYY-MM-DD', strictMode: true })
    .withMessage('Поле date должно быть датой в формате YYYY-MM-DD'),

  body('mealType')
    .notEmpty()
    .withMessage('Поле mealType обязательно')
    .isIn(MEAL_TYPES)
    .withMessage(`Поле mealType должно быть одним из: ${MEAL_TYPES.join(', ')}`),

  body('customMealName')
    .if(body('mealType').equals('custom'))
    .notEmpty()
    .withMessage('Поле customMealName обязательно при mealType = custom')
    .isString()
    .withMessage('Поле customMealName должно быть строкой'),
];

/**
 * Валидаторы для добавления позиции в лог питания (MealEntry).
 * Validates: Requirements 6.3
 *
 * @type {import('express-validator').ValidationChain[]}
 */
const addMealEntryValidators = [
  body('blyudoId')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('Поле blyudoId должно быть валидным UUID'),

  body('useSnapshot')
    .optional()
    .isBoolean()
    .withMessage('Поле useSnapshot должно быть булевым значением'),

  body('portionGrams')
    .optional({ nullable: true })
    .isFloat({ gt: 0 })
    .withMessage('Поле portionGrams должно быть положительным числом'),
];

module.exports = { createMealLogValidators, addMealEntryValidators };
