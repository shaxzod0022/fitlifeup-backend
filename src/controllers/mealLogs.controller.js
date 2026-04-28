'use strict';

const mealLogsService = require('../services/mealLogs.service');

/**
 * Контроллер для управления дневником питания (Meal Logs).
 * Validates: Requirements 6.6, 6.7, 6.9
 */

/**
 * GET /meal-logs?date=YYYY-MM-DD
 * Получить все записи питания пользователя за дату.
 */
async function list(req, res, next) {
  try {
    const mealLogs = await mealLogsService.getMealLogsByDate(req.userId, req.query.date);
    res.json(mealLogs);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /meal-logs
 * Создать новую запись дневника питания.
 */
async function create(req, res, next) {
  try {
    const mealLog = await mealLogsService.createMealLog(req.userId, req.body);
    res.status(201).json(mealLog);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /meal-logs/:id
 * Получить запись дневника питания по id.
 */
async function getById(req, res, next) {
  try {
    const mealLog = await mealLogsService.getMealLogById(req.userId, req.params.id);
    res.json(mealLog);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /meal-logs/:id/entries
 * Добавить позицию в запись дневника питания.
 */
async function addEntry(req, res, next) {
  try {
    const entry = await mealLogsService.addMealEntry(req.params.id, req.body);
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /meal-logs/summary?date=YYYY-MM-DD
 * Получить сводку питания пользователя за дату.
 */
async function summary(req, res, next) {
  try {
    const nutritionSummary = await mealLogsService.getNutritionSummary(req.userId, req.query.date);
    res.json(nutritionSummary);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  create,
  getById,
  addEntry,
  summary,
};
