'use strict';

const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createMealLogValidators, addMealEntryValidators } = require('../validators/mealLog.validators');
const mealLogsController = require('../controllers/mealLogs.controller');

const router = Router();

/**
 * Маршруты для управления дневником питания (Meal Logs).
 * Все маршруты защищены auth middleware.
 * Validates: Requirements 6.6, 6.7, 6.9
 */

/**
 * @swagger
 * tags:
 *   name: MealLogs
 *   description: Дневник питания
 */

/**
 * @swagger
 * /meal-logs:
 *   get:
 *     summary: Получить записи питания за дату
 *     description: Возвращает все записи дневника питания пользователя за указанную дату с вложенными позициями
 *     tags: [MealLogs]
 *     security:
 *       - UserIdAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-01-15"
 *         description: Дата в формате YYYY-MM-DD
 *     responses:
 *       200:
 *         description: Список записей питания
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MealLog'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', authMiddleware, mealLogsController.list);

/**
 * @swagger
 * /meal-logs:
 *   post:
 *     summary: Создать запись дневника питания
 *     tags: [MealLogs]
 *     security:
 *       - UserIdAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MealLogInput'
 *           example:
 *             date: "2024-01-15"
 *             mealType: "breakfast"
 *     responses:
 *       201:
 *         description: Запись создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MealLog'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.post('/', authMiddleware, validate(createMealLogValidators), mealLogsController.create);

/**
 * @swagger
 * /meal-logs/summary:
 *   get:
 *     summary: Получить сводку питания за дату
 *     description: Возвращает суммарные значения protein, carbohydrate, fat по всем записям за день
 *     tags: [MealLogs]
 *     security:
 *       - UserIdAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-01-15"
 *         description: Дата в формате YYYY-MM-DD
 *     responses:
 *       200:
 *         description: Сводка макронутриентов
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 protein:
 *                   type: number
 *                   description: Суммарный белок (г)
 *                 carbohydrate:
 *                   type: number
 *                   description: Суммарные углеводы (г)
 *                 fat:
 *                   type: number
 *                   description: Суммарные жиры (г)
 *             example:
 *               protein: 45.5
 *               carbohydrate: 120.0
 *               fat: 30.2
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
// ВАЖНО: маршрут /summary должен быть определён ДО /:id,
// чтобы Express не воспринял "summary" как значение параметра :id
router.get('/summary', authMiddleware, mealLogsController.summary);

/**
 * @swagger
 * /meal-logs/{id}:
 *   get:
 *     summary: Получить запись питания по id
 *     tags: [MealLogs]
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
 *         description: Запись питания с вложенными позициями
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MealLog'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', authMiddleware, mealLogsController.getById);

/**
 * @swagger
 * /meal-logs/{id}/entries:
 *   post:
 *     summary: Добавить позицию в запись питания
 *     tags: [MealLogs]
 *     security:
 *       - UserIdAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Идентификатор записи дневника питания
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MealEntryInput'
 *           example:
 *             blyudoId: "550e8400-e29b-41d4-a716-446655440000"
 *             useSnapshot: true
 *             portionGrams: 200
 *     responses:
 *       201:
 *         description: Позиция добавлена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MealEntry'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:id/entries', authMiddleware, validate(addMealEntryValidators), mealLogsController.addEntry);

module.exports = router;
