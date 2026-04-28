'use strict';

const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createExerciseValidators, updateExerciseValidators } = require('../validators/exercise.validators');
const exercisesController = require('../controllers/exercises.controller');

const router = Router();

/**
 * Маршруты для управления упражнениями (Exercises/Zanyatiya).
 * Все маршруты защищены auth middleware.
 * Validates: Requirements 1.2, 1.3, 1.4, 1.6, 1.8
 */

/**
 * @swagger
 * tags:
 *   name: Exercises
 *   description: Управление упражнениями
 */

/**
 * @swagger
 * /exercises:
 *   get:
 *     summary: Получить список упражнений
 *     description: Возвращает публичные упражнения из каталога и собственные упражнения пользователя
 *     tags: [Exercises]
 *     security:
 *       - UserIdAuth: []
 *     responses:
 *       200:
 *         description: Список упражнений
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Exercise'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', authMiddleware, exercisesController.listExercises);

/**
 * @swagger
 * /exercises:
 *   post:
 *     summary: Создать упражнение
 *     tags: [Exercises]
 *     security:
 *       - UserIdAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExerciseInput'
 *           example:
 *             name: "Приседания"
 *             subtitle: "Базовое упражнение"
 *             tags: ["ноги", "базовое"]
 *             time: 1.5
 *             visibility: "private"
 *     responses:
 *       201:
 *         description: Упражнение создано
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Exercise'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/', authMiddleware, validate(createExerciseValidators), exercisesController.createExercise);

/**
 * @swagger
 * /exercises/{id}:
 *   get:
 *     summary: Получить упражнение по id
 *     tags: [Exercises]
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
 *         description: Упражнение
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Exercise'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', authMiddleware, exercisesController.getExercise);

/**
 * @swagger
 * /exercises/{id}:
 *   put:
 *     summary: Обновить упражнение
 *     tags: [Exercises]
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
 *             $ref: '#/components/schemas/ExerciseInput'
 *     responses:
 *       200:
 *         description: Упражнение обновлено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Exercise'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', authMiddleware, validate(updateExerciseValidators), exercisesController.updateExercise);

/**
 * @swagger
 * /exercises/{id}:
 *   delete:
 *     summary: Удалить упражнение
 *     tags: [Exercises]
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
 *         description: Упражнение удалено
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', authMiddleware, exercisesController.deleteExercise);

module.exports = router;
