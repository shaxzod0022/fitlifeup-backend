'use strict';

const progressService = require('../services/progress.service');

/**
 * Контроллер для отслеживания прогресса тренировок.
 * Validates: Requirements 4.3, 4.4, 4.5, 4.6
 */

/**
 * POST /progress/sets/:setId/complete
 * Отметить сет как завершённый.
 */
async function completeSet(req, res, next) {
  try {
    const result = await progressService.completeSet(req.userId, req.params.setId, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /progress/programs/:programId/complete
 * Отметить программу как завершённую.
 */
async function completeProgram(req, res, next) {
  try {
    const result = await progressService.completeProgram(req.userId, req.params.programId, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /progress/stats
 * Получить статистику прогресса пользователя.
 */
async function getStats(req, res, next) {
  try {
    const stats = await progressService.getProgressStats(req.userId);
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /progress/history
 * Получить историю завершений пользователя.
 */
async function getHistory(req, res, next) {
  try {
    const limit = req.query.limit !== undefined ? parseInt(req.query.limit, 10) : undefined;
    const offset = req.query.offset !== undefined ? parseInt(req.query.offset, 10) : undefined;
    const history = await progressService.getCompletionHistory(
      req.userId,
      limit,
      offset
    );
    res.status(200).json(history);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  completeSet,
  completeProgram,
  getStats,
  getHistory,
};
