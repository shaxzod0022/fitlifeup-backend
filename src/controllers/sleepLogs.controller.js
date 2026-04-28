'use strict';

const sleepLogsService = require('../services/sleepLogs.service');

/**
 * Контроллер для управления дневником сна (Sleep Logs).
 * Validates: Requirements 7.2, 7.5, 7.6, 7.8, 7.9
 */

/**
 * GET /sleep-logs
 * Получить список записей сна пользователя с пагинацией.
 */
async function list(req, res, next) {
  try {
    const sleepLogs = await sleepLogsService.listSleepLogs(req.userId, req.query.limit, req.query.offset);
    res.json(sleepLogs);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /sleep-logs
 * Создать новую запись дневника сна.
 */
async function create(req, res, next) {
  try {
    const sleepLog = await sleepLogsService.createSleepLog(req.userId, req.body);
    res.status(201).json(sleepLog);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /sleep-logs/:id
 * Получить запись дневника сна по id.
 */
async function getById(req, res, next) {
  try {
    const sleepLog = await sleepLogsService.getSleepLogById(req.userId, req.params.id);
    res.json(sleepLog);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /sleep-logs/:id
 * Обновить запись дневника сна.
 */
async function update(req, res, next) {
  try {
    const sleepLog = await sleepLogsService.updateSleepLog(req.userId, req.params.id, req.body);
    res.json(sleepLog);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /sleep-logs/:id
 * Удалить запись дневника сна.
 */
async function remove(req, res, next) {
  try {
    await sleepLogsService.deleteSleepLog(req.userId, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * GET /sleep-logs/stats
 * Получить статистику сна пользователя за период.
 */
async function stats(req, res, next) {
  try {
    const sleepStats = await sleepLogsService.getSleepStats(req.userId, req.query.startDate, req.query.endDate);
    res.json(sleepStats);
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
  stats,
};
