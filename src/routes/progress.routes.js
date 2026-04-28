'use strict';

const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const progressController = require('../controllers/progress.controller');

const router = Router();

/**
 * Маршруты для отслеживания прогресса тренировок.
 * Все маршруты защищены auth middleware.
 * Validates: Requirements 4.3, 4.4, 4.5, 4.6
 */

/**
 * @swagger
 * tags:
 *   name: Progress
 *   description: Отслеживание прогресса тренировок
 */

/**
 * @swagger
 * /progress/sets/{setId}/complete:
 *   post:
 *     summary: Отметить сет как завершённый
 *     description: Создаёт запись о завершении сета с временной меткой и опциональной фактической длительностью
 *     tags: [Progress]
 *     security:
 *       - UserIdAuth: []
 *     parameters:
 *       - in: path
 *         name: setId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Идентификатор завершённого сета
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               durationMinutes:
 *                 type: number
 *                 nullable: true
 *                 description: Фактическое время выполнения в минутах
 *           example:
 *             durationMinutes: 45
 *     responses:
 *       201:
 *         description: Запись о завершении сета создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CompletedSet'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/sets/:setId/complete', authMiddleware, progressController.completeSet);

/**
 * @swagger
 * /progress/programs/{programId}/complete:
 *   post:
 *     summary: Отметить программу как завершённую
 *     description: Создаёт запись о завершении программы с временной меткой и опциональной фактической длительностью
 *     tags: [Progress]
 *     security:
 *       - UserIdAuth: []
 *     parameters:
 *       - in: path
 *         name: programId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Идентификатор завершённой программы
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               durationMinutes:
 *                 type: number
 *                 nullable: true
 *                 description: Фактическое время выполнения в минутах
 *           example:
 *             durationMinutes: 90
 *     responses:
 *       201:
 *         description: Запись о завершении программы создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CompletedProgram'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/programs/:programId/complete', authMiddleware, progressController.completeProgram);

/**
 * @swagger
 * /progress/stats:
 *   get:
 *     summary: Получить статистику прогресса
 *     description: Возвращает общее количество завершённых сетов и программ, а также количество тренировочных дней за последние 7 и 30 дней
 *     tags: [Progress]
 *     security:
 *       - UserIdAuth: []
 *     responses:
 *       200:
 *         description: Статистика прогресса пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalCompletedSets:
 *                   type: integer
 *                   description: Общее количество завершённых сетов
 *                 totalCompletedPrograms:
 *                   type: integer
 *                   description: Общее количество завершённых программ
 *                 trainingDaysLast7:
 *                   type: integer
 *                   description: Количество тренировочных дней за последние 7 дней
 *                 trainingDaysLast30:
 *                   type: integer
 *                   description: Количество тренировочных дней за последние 30 дней
 *             example:
 *               totalCompletedSets: 42
 *               totalCompletedPrograms: 5
 *               trainingDaysLast7: 4
 *               trainingDaysLast30: 18
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/stats', authMiddleware, progressController.getStats);

/**
 * @swagger
 * /progress/history:
 *   get:
 *     summary: Получить историю завершений
 *     description: Возвращает объединённый список завершённых сетов и программ, отсортированный по completedAt в убывающем порядке, с поддержкой пагинации
 *     tags: [Progress]
 *     security:
 *       - UserIdAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Максимальное количество записей
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Смещение для пагинации
 *     responses:
 *       200:
 *         description: История завершений
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [set, program]
 *                     description: Тип завершённой записи
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   userId:
 *                     type: string
 *                   setId:
 *                     type: string
 *                     format: uuid
 *                     nullable: true
 *                   programId:
 *                     type: string
 *                     format: uuid
 *                     nullable: true
 *                   completedAt:
 *                     type: string
 *                     format: date-time
 *                   durationMinutes:
 *                     type: number
 *                     nullable: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/history', authMiddleware, progressController.getHistory);

module.exports = router;
