'use strict';

const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const recommendationsController = require('../controllers/recommendations.controller');

const router = Router();

/**
 * Маршруты для рекомендаций (заглушка).
 * Validates: Requirements 12.1, 12.2, 12.3
 */

/**
 * @swagger
 * tags:
 *   name: Recommendations
 *   description: Рекомендации (placeholder)
 */

/**
 * @swagger
 * /recommendations:
 *   get:
 *     summary: Получить рекомендации (заглушка)
 *     description: >
 *       Placeholder эндпоинта рекомендаций. Возвращает сообщение о том,
 *       что модуль рекомендаций будет реализован в будущем.
 *       Интерфейс зафиксирован для подключения AI-модуля без изменения контракта.
 *     tags: [Recommendations]
 *     security:
 *       - UserIdAuth: []
 *     responses:
 *       200:
 *         description: Заглушка рекомендаций
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Модуль рекомендаций будет реализован в будущем."
 *                 data:
 *                   type: object
 *                   properties:
 *                     workout:
 *                       type: object
 *                     nutrition:
 *                       type: object
 *                     sleep:
 *                       type: object
 *             example:
 *               message: "Модуль рекомендаций будет реализован в будущем."
 *               data:
 *                 workout:
 *                   userId: "user-123"
 *                   type: "workout"
 *                   message: "Модуль рекомендаций будет реализован в будущем."
 *                   recommendations: []
 *                 nutrition:
 *                   userId: "user-123"
 *                   type: "nutrition"
 *                   message: "Модуль рекомендаций будет реализован в будущем."
 *                   recommendations: []
 *                 sleep:
 *                   userId: "user-123"
 *                   type: "sleep"
 *                   message: "Модуль рекомендаций будет реализован в будущем."
 *                   recommendations: []
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', authMiddleware, recommendationsController.getRecommendations);

module.exports = router;
