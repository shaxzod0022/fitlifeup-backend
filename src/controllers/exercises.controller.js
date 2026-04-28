'use strict';

const exercisesService = require('../services/exercises.service');

/**
 * Контроллер для управления упражнениями (Exercises/Zanyatiya).
 * Validates: Requirements 1.2, 1.3, 1.4, 1.6, 1.8
 */

/**
 * GET /exercises
 * Получить список упражнений: публичные + собственные.
 */
async function listExercises(req, res, next) {
  try {
    const isPrivileged = req.userRole === 'superadmin' || req.userPermissions.includes('manage_exercises');
    const exercises = await exercisesService.listExercises(req.userId, isPrivileged);
    res.json(exercises);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /exercises
 * Создать новое упражнение.
 */
async function createExercise(req, res, next) {
  try {
    const exercise = await exercisesService.createExercise(req.userId, req.body);
    res.status(201).json(exercise);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /exercises/:id
 * Получить упражнение по id.
 */
async function getExercise(req, res, next) {
  try {
    const isPrivileged = req.userRole === 'superadmin' || req.userPermissions.includes('manage_exercises');
    const exercise = await exercisesService.getExerciseById(req.userId, req.params.id, isPrivileged);
    res.json(exercise);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /exercises/:id
 * Обновить упражнение.
 */
async function updateExercise(req, res, next) {
  try {
    const isPrivileged = req.userRole === 'superadmin' || req.userPermissions.includes('manage_exercises');
    const exercise = await exercisesService.updateExercise(req.userId, req.params.id, req.body, isPrivileged);
    res.json(exercise);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /exercises/:id
 * Удалить упражнение.
 */
async function deleteExercise(req, res, next) {
  try {
    const isPrivileged = req.userRole === 'superadmin' || req.userPermissions.includes('manage_exercises');
    await exercisesService.deleteExercise(req.userId, req.params.id, isPrivileged);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listExercises,
  createExercise,
  getExercise,
  updateExercise,
  deleteExercise,
};
