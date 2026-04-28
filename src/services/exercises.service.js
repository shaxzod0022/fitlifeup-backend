'use strict';

const { Op } = require('sequelize');
const { Exercise } = require('../models/index');
const { NotFoundError, ForbiddenError } = require('../utils/errors');

/**
 * Создать упражнение.
 * Requirement 1.2
 * @param {string} userId - Идентификатор пользователя
 * @param {object} data - Данные упражнения
 * @returns {Promise<Exercise>} Созданное упражнение
 */
async function createExercise(userId, data) {
  const exercise = await Exercise.create({ ...data, creatorId: userId });
  return exercise;
}

/**
 * Получить список упражнений.
 * Возвращает публичные упражнения (из каталога Admin) и собственные упражнения пользователя.
 * Requirement 1.3, 1.10
 * @param {string} userId - Идентификатор пользователя
 * @returns {Promise<Exercise[]>} Список упражнений
 */
async function listExercises(userId, isPrivileged = false) {
  const whereClause = isPrivileged 
    ? {} 
    : {
        [Op.or]: [
          { visibility: 'public' },
          { creatorId: userId },
        ],
      };

  const exercises = await Exercise.findAll({
    where: whereClause,
  });
  return exercises;
}

/**
 * Получить упражнение по id.
 * Requirement 1.4, 1.5
 * @param {string} userId - Идентификатор пользователя
 * @param {string} id - Идентификатор упражнения
 * @returns {Promise<Exercise>} Упражнение
 * @throws {NotFoundError} Если упражнение не найдено
 * @throws {ForbiddenError} Если упражнение приватное и принадлежит другому пользователю
 */
async function getExerciseById(userId, id, isPrivileged = false) {
  const exercise = await Exercise.findByPk(id);

  if (!exercise) {
    throw new NotFoundError(`Упражнение с id ${id} не найдено`);
  }

  if (!isPrivileged && exercise.visibility === 'private' && exercise.creatorId !== userId) {
    throw new ForbiddenError('Доступ к приватному упражнению запрещён');
  }

  return exercise;
}

/**
 * Обновить упражнение.
 * Requirement 1.6, 1.7
 * @param {string} userId - Идентификатор пользователя
 * @param {string} id - Идентификатор упражнения
 * @param {object} data - Данные для обновления
 * @returns {Promise<Exercise>} Обновлённое упражнение
 * @throws {NotFoundError} Если упражнение не найдено
 * @throws {ForbiddenError} Если пользователь не является владельцем
 */
async function updateExercise(userId, id, data, isPrivileged = false) {
  const exercise = await Exercise.findByPk(id);

  if (!exercise) {
    throw new NotFoundError(`Упражнение с id ${id} не найдено`);
  }

  if (!isPrivileged && exercise.creatorId !== userId) {
    throw new ForbiddenError('Нет прав для изменения чужого упражнения');
  }

  await exercise.update(data);
  return exercise;
}

/**
 * Удалить упражнение.
 * Requirement 1.7, 1.8
 * @param {string} userId - Идентификатор пользователя
 * @param {string} id - Идентификатор упражнения
 * @returns {Promise<void>}
 * @throws {NotFoundError} Если упражнение не найдено
 * @throws {ForbiddenError} Если пользователь не является владельцем
 */
async function deleteExercise(userId, id, isPrivileged = false) {
  const exercise = await Exercise.findByPk(id);

  if (!exercise) {
    throw new NotFoundError(`Упражнение с id ${id} не найдено`);
  }

  if (!isPrivileged && exercise.creatorId !== userId) {
    throw new ForbiddenError('Нет прав для удаления чужого упражнения');
  }

  await exercise.destroy();
}

module.exports = {
  createExercise,
  listExercises,
  getExerciseById,
  updateExercise,
  deleteExercise,
};
