'use strict';

const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { body } = require('express-validator');
const programsController = require('../controllers/programs.controller');

const router = Router();

/**
 * Валидаторы для создания программы.
 */
const createProgramValidators = [
  body('name')
    .notEmpty()
    .withMessage('Поле name обязательно')
    .isString()
    .withMessage('Поле name должно быть строкой'),
  body('visibility')
    .optional()
    .isIn(['public', 'private'])
    .withMessage('Поле visibility должно быть одним из: public, private'),
  body('sets').optional().isArray().withMessage('Поле sets должно быть массивом'),
  body('sets.*').optional().isUUID().withMessage('Каждый элемент sets должен быть UUID'),
  body('tags').optional().isArray().withMessage('Поле tags должно быть массивом'),
  body('level').optional().isString().withMessage('Поле level должно быть строкой'),
  body('subtitle').optional().isString().withMessage('Поле subtitle должно быть строкой'),
  body('image').optional().isString().withMessage('Поле image должно быть строкой'),
];

/**
 * Валидаторы для обновления программы.
 */
const updateProgramValidators = [
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
  body('sets').optional().isArray().withMessage('Поле sets должно быть массивом'),
  body('sets.*').optional().isUUID().withMessage('Каждый элемент sets должен быть UUID'),
  body('tags').optional().isArray().withMessage('Поле tags должно быть массивом'),
  body('level').optional().isString().withMessage('Поле level должно быть строкой'),
  body('subtitle').optional().isString().withMessage('Поле subtitle должно быть строкой'),
  body('image').optional().isString().withMessage('Поле image должно быть строкой'),
];

/**
 * Маршруты для управления программами (Programs).
 * Все маршруты защищены auth middleware.
 * Validates: Requirements 3.3, 3.4, 3.6, 3.8
 */

/**
 * @swagger
 * tags:
 *   name: Programs
 *   description: Управление тренировочными программами
 */

/**
 * @swagger
 * /programs:
 *   get:
 *     summary: Получить список программ
 *     tags: [Programs]
 *     security:
 *       - UserIdAuth: []
 *     responses:
 *       200:
 *         description: Список программ
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WorkoutProgram'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', authMiddleware, programsController.listPrograms);

/**
 * @swagger
 * /programs:
 *   post:
 *     summary: Создать программу
 *     tags: [Programs]
 *     security:
 *       - UserIdAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkoutProgramInput'
 *           example:
 *             name: "Программа для похудения"
 *             subtitle: "7-дневный курс"
 *             tags: ["похудение", "кардио"]
 *             level: "beginner"
 *             visibility: "private"
 *             sets: ["uuid-set-1", "uuid-set-2"]
 *     responses:
 *       201:
 *         description: Программа создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkoutProgram'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntity'
 */
router.post('/', authMiddleware, validate(createProgramValidators), programsController.createProgram);

/**
 * @swagger
 * /programs/{id}:
 *   get:
 *     summary: Получить программу по id
 *     tags: [Programs]
 *     security:
 *       - UserIdAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Программа
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkoutProgram'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', authMiddleware, programsController.getProgram);

/**
 * @swagger
 * /programs/{id}:
 *   put:
 *     summary: Обновить программу
 *     tags: [Programs]
 *     security:
 *       - UserIdAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkoutProgramInput'
 *     responses:
 *       200:
 *         description: Программа обновлена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkoutProgram'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', authMiddleware, validate(updateProgramValidators), programsController.updateProgram);

/**
 * @swagger
 * /programs/{id}:
 *   delete:
 *     summary: Удалить программу
 *     tags: [Programs]
 *     security:
 *       - UserIdAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Программа удалена
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', authMiddleware, programsController.deleteProgram);

module.exports = router;
