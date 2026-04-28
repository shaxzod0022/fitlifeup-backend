'use strict';

const dishesService = require('../services/dishes.service');

/**
 * Контроллер для управления блюдами (Dishes/Blyuda).
 * Validates: Requirements 5.2, 5.3, 5.4, 5.6
 */

/**
 * GET /dishes
 * Получить список блюд: публичные + собственные.
 */
async function list(req, res, next) {
  try {
    const dishes = await dishesService.listDishes(req.userId, req.userRole);
    res.json(dishes);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /dishes
 * Создать новое блюдо.
 */
async function create(req, res, next) {
  try {
    const dish = await dishesService.createDish(req.userId, req.body, req.userRole);
    res.status(201).json(dish);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /dishes/:id
 * Получить блюдо по id.
 */
async function getById(req, res, next) {
  try {
    const dish = await dishesService.getDishById(req.userId, req.params.id, req.userRole);
    res.json(dish);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /dishes/:id
 * Обновить блюдо.
 */
async function update(req, res, next) {
  try {
    const dish = await dishesService.updateDish(req.userId, req.params.id, req.body, req.userRole);
    res.json(dish);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /dishes/:id
 * Удалить блюдо.
 */
async function remove(req, res, next) {
  try {
    await dishesService.deleteDish(req.userId, req.params.id, req.userRole);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  create,
  getById,
  update,
  remove,
};
