'use strict';

const { body } = require('express-validator');

/**
 * Валидаторы для создания записи о сне (SleepLog).
 * Validates: Requirements 7.3, 7.4
 *
 * Note: the wakeAt > sleepAt check is performed in the service layer.
 *
 * @type {import('express-validator').ValidationChain[]}
 */
const createSleepLogValidators = [
  body('sleepAt')
    .notEmpty()
    .withMessage('Поле sleepAt обязательно')
    .isISO8601()
    .withMessage('Поле sleepAt должно быть валидной датой в формате ISO8601'),

  body('wakeAt')
    .notEmpty()
    .withMessage('Поле wakeAt обязательно')
    .isISO8601()
    .withMessage('Поле wakeAt должно быть валидной датой в формате ISO8601'),

  body('qualityScore')
    .optional({ nullable: true })
    .isInt({ min: 1, max: 5 })
    .withMessage('Поле qualityScore должно быть целым числом от 1 до 5'),

  body('awakenings')
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage('Поле awakenings должно быть неотрицательным целым числом'),
];

/**
 * Валидаторы для обновления записи о сне (SleepLog).
 * Все поля опциональны, правила те же, что и при создании.
 * Validates: Requirements 7.3, 7.4
 *
 * @type {import('express-validator').ValidationChain[]}
 */
const updateSleepLogValidators = [
  body('sleepAt')
    .optional()
    .isISO8601()
    .withMessage('Поле sleepAt должно быть валидной датой в формате ISO8601'),

  body('wakeAt')
    .optional()
    .isISO8601()
    .withMessage('Поле wakeAt должно быть валидной датой в формате ISO8601'),

  body('qualityScore')
    .optional({ nullable: true })
    .isInt({ min: 1, max: 5 })
    .withMessage('Поле qualityScore должно быть целым числом от 1 до 5'),

  body('awakenings')
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage('Поле awakenings должно быть неотрицательным целым числом'),
];

module.exports = { createSleepLogValidators, updateSleepLogValidators };
