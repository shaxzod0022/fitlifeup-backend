'use strict';

const setsService = require('../services/sets.service');

/**
 * Контроллер для управления сетами (Sets).
 * Validates: Requirements 2.3, 2.4, 2.6, 2.8
 */

/**
 * GET /sets
 * Получить список сетов: публичные + собственные.
 */
async function listSets(req, res, next) {
  try {
    const sets = await setsService.listSets(req.userId, req.userRole);
    res.json(sets);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /sets
 * Создать новый сет.
 */
async function createSet(req, res, next) {
  try {
    const workoutSet = await setsService.createSet(req.userId, req.body, req.userRole);
    res.status(201).json(workoutSet);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /sets/:id
 * Получить сет по id.
 */
async function getSet(req, res, next) {
  try {
    const workoutSet = await setsService.getSetById(req.userId, req.params.id, req.userRole);
    res.json(workoutSet);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /sets/:id
 * Обновить сет.
 */
async function updateSet(req, res, next) {
  try {
    const workoutSet = await setsService.updateSet(req.userId, req.params.id, req.body, req.userRole);
    res.json(workoutSet);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /sets/:id
 * Удалить сет.
 */
async function deleteSet(req, res, next) {
  try {
    await setsService.deleteSet(req.userId, req.params.id, req.userRole);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listSets,
  createSet,
  getSet,
  updateSet,
  deleteSet,
};
