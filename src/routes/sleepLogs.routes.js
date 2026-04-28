'use strict';

const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createSleepLogValidators, updateSleepLogValidators } = require('../validators/sleepLog.validators');
const sleepLogsController = require('../controllers/sleepLogs.controller');

const router = Router();

/**
 * Маршруты для управления дневником сна (Sleep Logs).
 * Все маршруты защищены auth middleware.
 * Validates: Requirements 7.2, 7.5, 7.6, 7.8, 7.9
 */

/**
 * @swagger
 * tags:
 *   name: SleepLogs
 *   description: Управление дневником сна
 */

/**
 * @swagger
 * /sleep-logs:
 *   get:
 *     summary: Получить список записей сна
 *     description: Возвращает записи сна пользователя, отсортированные по sleepAt DESC, с поддержкой пагинации
 *     tags: [SleepLogs]
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
 *         description: Список записей сна
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SleepLog'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', authMiddleware, sleepLogsController.list);

/**
 * @swagger
 * /sleep-logs:
 *   post:
 *     summary: Создать запись сна
 *     tags: [SleepLogs]
 *     security:
 *       - UserIdAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SleepLogInput'
 *           example:
 *             sleepAt: "2024-01-15T22:30:00.000Z"
 *             wakeAt: "2024-01-16T06:30:00.000Z"
 *             qualityScore: 4
 *             awakenings: 1
 *     responses:
 *       201:
 *         description: Запись сна создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SleepLog'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/', authMiddleware, validate(createSleepLogValidators), sleepLogsController.create);

/**
 * @swagger
 * /sleep-logs/stats:
 *   get:
 *     summary: Получить статистику сна за период
 *     description: Возвращает среднюю продолжительность сна, среднюю оценку качества и среднее число пробуждений
 *     tags: [SleepLogs]
 *     security:
 *       - UserIdAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Начало периода (ISO8601)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Конец периода (ISO8601)
 *     responses:
 *       200:
 *         description: Статистика сна
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 avgDurationHours:
 *                   type: number
 *                   nullable: true
 *                 avgQualityScore:
 *                   type: number
 *                   nullable: true
 *                 avgAwakenings:
 *                   type: number
 *                   nullable: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/stats', authMiddleware, sleepLogsController.stats);

/**
 * @swagger
 * /sleep-logs/{id}:
 *   get:
 *     summary: Получить запись сна по id
 *     tags: [SleepLogs]
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
 *         description: Запись сна
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SleepLog'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', authMiddleware, sleepLogsController.getById);

/**
 * @swagger
 * /sleep-logs/{id}:
 *   put:
 *     summary: Обновить запись сна
 *     tags: [SleepLogs]
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
 *             $ref: '#/components/schemas/SleepLogInput'
 *     responses:
 *       200:
 *         description: Запись сна обновлена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SleepLog'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', authMiddleware, validate(updateSleepLogValidators), sleepLogsController.update);

/**
 * @swagger
 * /sleep-logs/{id}:
 *   delete:
 *     summary: Удалить запись сна
 *     tags: [SleepLogs]
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
 *         description: Запись сна удалена
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', authMiddleware, sleepLogsController.remove);

module.exports = router;
