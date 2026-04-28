'use strict';

const programsService = require('../services/programs.service');

/**
 * Контроллер для управления программами (Programs).
 * Validates: Requirements 3.3, 3.4, 3.6, 3.8
 */

/**
 * GET /programs
 * Получить список программ: публичные + собственные.
 */
async function listPrograms(req, res, next) {
  try {
    const programs = await programsService.listPrograms(req.userId, req.userRole);
    res.json(programs);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /programs
 * Создать новую программу.
 */
async function createProgram(req, res, next) {
  try {
    const program = await programsService.createProgram(req.userId, req.body, req.userRole);
    res.status(201).json(program);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /programs/:id
 * Получить программу по id.
 */
async function getProgram(req, res, next) {
  try {
    const program = await programsService.getProgramById(req.userId, req.params.id, req.userRole);
    res.json(program);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /programs/:id
 * Обновить программу.
 */
async function updateProgram(req, res, next) {
  try {
    const program = await programsService.updateProgram(req.userId, req.params.id, req.body, req.userRole);
    res.json(program);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /programs/:id
 * Удалить программу.
 */
async function deleteProgram(req, res, next) {
  try {
    await programsService.deleteProgram(req.userId, req.params.id, req.userRole);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listPrograms,
  createProgram,
  getProgram,
  updateProgram,
  deleteProgram,
};
