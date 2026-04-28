'use strict';

const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createProfileValidators, updateProfileValidators } = require('../validators/userProfile.validators');
const userProfileController = require('../controllers/userProfile.controller');

const router = Router();

/**
 * Маршруты для управления профилем пользователя (UserProfile).
 * Роутер монтируется по пути /profile в корневом роутере.
 * Все маршруты защищены auth middleware.
 * Validates: Requirements 8.4, 8.6, 8.8
 */

/**
 * @swagger
 * tags:
 *   name: UserProfile
 *   description: Управление профилем пользователя
 */

/**
 * @swagger
 * /profile:
 *   post:
 *     summary: Создать профиль пользователя
 *     description: Создаёт профиль для аутентифицированного пользователя. Возвращает 409, если профиль уже существует.
 *     tags: [UserProfile]
 *     security:
 *       - UserIdAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserProfileInput'
 *           example:
 *             name: "Иван Иванов"
 *             phone: "+7-900-000-00-00"
 *             gender: "male"
 *             age: 30
 *             height: 180
 *             weight: 75
 *             fitnessGoal: "muscle_gain"
 *             workoutFrequency: "medium"
 *     responses:
 *       201:
 *         description: Профиль создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.post('/', authMiddleware, validate(createProfileValidators), userProfileController.create);

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Получить профиль пользователя
 *     description: Возвращает профиль аутентифицированного пользователя.
 *     tags: [UserProfile]
 *     security:
 *       - UserIdAuth: []
 *     responses:
 *       200:
 *         description: Профиль пользователя
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/', authMiddleware, userProfileController.get);

/**
 * @swagger
 * /profile:
 *   put:
 *     summary: Обновить профиль пользователя
 *     description: Обновляет профиль аутентифицированного пользователя.
 *     tags: [UserProfile]
 *     security:
 *       - UserIdAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserProfileInput'
 *           example:
 *             weight: 73
 *             fitnessGoal: "weight_maintenance"
 *     responses:
 *       200:
 *         description: Профиль обновлён
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/', authMiddleware, validate(updateProfileValidators), userProfileController.update);

module.exports = router;
