'use strict';

const { Router } = require('express');

const router = Router();

/**
 * Маршруты для проверки состояния сервиса.
 * Не требует auth middleware.
 * Validates: Requirements 10.7
 */

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Состояние сервиса
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Проверка состояния сервиса
 *     description: Возвращает информацию о текущем состоянии сервиса. Не требует аутентификации.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Сервис работает нормально
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 uptime:
 *                   type: number
 *                   description: Время работы сервиса в секундах
 *                   example: 123.45
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-01T00:00:00.000Z"
 *             example:
 *               status: "ok"
 *               uptime: 123.45
 *               timestamp: "2024-01-01T00:00:00.000Z"
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
