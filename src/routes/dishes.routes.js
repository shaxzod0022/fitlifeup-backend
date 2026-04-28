'use strict';

const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createDishValidators, updateDishValidators } = require('../validators/dish.validators');
const dishesController = require('../controllers/dishes.controller');

const router = Router();

/**
 * Маршруты для управления блюдами (Dishes/Blyuda).
 * Все маршруты защищены auth middleware.
 * Validates: Requirements 5.2, 5.3, 5.4, 5.6
 */

/**
 * @swagger
 * tags:
 *   name: Dishes
 *   description: Управление блюдами
 */

/**
 * @swagger
 * /dishes:
 *   get:
 *     summary: Получить список блюд
 *     description: Возвращает публичные блюда из каталога и собственные блюда пользователя
 *     tags: [Dishes]
 *     security:
 *       - UserIdAuth: []
 *     responses:
 *       200:
 *         description: Список блюд
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Dish'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', authMiddleware, dishesController.list);

/**
 * @swagger
 * /dishes:
 *   post:
 *     summary: Создать блюдо
 *     tags: [Dishes]
 *     security:
 *       - UserIdAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DishInput'
 *           example:
 *             name: "Овсяная каша"
 *             description: "Классическая овсянка"
 *             tags: ["завтрак", "злаки"]
 *             visibility: "private"
 *             protein: 3.2
 *             carbohydrate: 15.0
 *             fat: 1.5
 *     responses:
 *       201:
 *         description: Блюдо создано
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dish'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/', authMiddleware, validate(createDishValidators), dishesController.create);

/**
 * @swagger
 * /dishes/{id}:
 *   get:
 *     summary: Получить блюдо по id
 *     tags: [Dishes]
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
 *         description: Блюдо
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dish'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', authMiddleware, dishesController.getById);

/**
 * @swagger
 * /dishes/{id}:
 *   put:
 *     summary: Обновить блюдо
 *     tags: [Dishes]
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
 *             $ref: '#/components/schemas/DishInput'
 *     responses:
 *       200:
 *         description: Блюдо обновлено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dish'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', authMiddleware, validate(updateDishValidators), dishesController.update);

/**
 * @swagger
 * /dishes/{id}:
 *   delete:
 *     summary: Удалить блюдо
 *     tags: [Dishes]
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
 *         description: Блюдо удалено
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', authMiddleware, dishesController.remove);

module.exports = router;
