'use strict';

const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createSetValidators, updateSetValidators } = require('../validators/set.validators');
const setsController = require('../controllers/sets.controller');

const router = Router();

/**
 * Маршруты для управления сетами (Sets).
 * Все маршруты защищены auth middleware.
 * Validates: Requirements 2.3, 2.4, 2.6, 2.8
 */

/**
 * @swagger
 * tags:
 *   name: Sets
 *   description: Управление тренировочными сетами
 */

/**
 * @swagger
 * /sets:
 *   get:
 *     summary: Получить список сетов
 *     description: Возвращает публичные сеты из каталога и собственные сеты пользователя
 *     tags: [Sets]
 *     security:
 *       - UserIdAuth: []
 *     responses:
 *       200:
 *         description: Список сетов
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WorkoutSet'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', authMiddleware, setsController.listSets);

/**
 * @swagger
 * /sets:
 *   post:
 *     summary: Создать сет
 *     tags: [Sets]
 *     security:
 *       - UserIdAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkoutSetInput'
 *           example:
 *             name: "Утренняя разминка"
 *             tags: ["утро", "разминка"]
 *             level: "beginner"
 *             visibility: "private"
 *             items:
 *               - exerciseId: "uuid-here"
 *                 count: 3
 *                 break: 30
 *                 repeats: 2
 *     responses:
 *       201:
 *         description: Сет создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkoutSet'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntity'
 */
router.post('/', authMiddleware, validate(createSetValidators), setsController.createSet);

/**
 * @swagger
 * /sets/{id}:
 *   get:
 *     summary: Получить сет по id
 *     tags: [Sets]
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
 *         description: Сет
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkoutSet'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', authMiddleware, setsController.getSet);

/**
 * @swagger
 * /sets/{id}:
 *   put:
 *     summary: Обновить сет
 *     tags: [Sets]
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
 *             $ref: '#/components/schemas/WorkoutSetInput'
 *     responses:
 *       200:
 *         description: Сет обновлён
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkoutSet'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', authMiddleware, validate(updateSetValidators), setsController.updateSet);

/**
 * @swagger
 * /sets/{id}:
 *   delete:
 *     summary: Удалить сет
 *     tags: [Sets]
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
 *         description: Сет удалён
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', authMiddleware, setsController.deleteSet);

module.exports = router;
