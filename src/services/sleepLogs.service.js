'use strict';

const { Op } = require('sequelize');
const { SleepLog } = require('../models/index');
const { ValidationError, NotFoundError, ForbiddenError } = require('../utils/errors');

/**
 * Создать запись дневника сна.
 * Валидирует, что wakeAt > sleepAt.
 * Requirement 7.2, 7.3
 * @param {string} userId - Идентификатор пользователя
 * @param {object} data - Данные записи (sleepAt, wakeAt, qualityScore, awakenings)
 * @returns {Promise<SleepLog>} Созданная запись
 * @throws {ValidationError} Если wakeAt не позже sleepAt
 */
async function createSleepLog(userId, data) {
  if (new Date(data.wakeAt) <= new Date(data.sleepAt)) {
    throw new ValidationError('Время пробуждения должно быть позже времени засыпания');
  }

  if (data.qualityScore !== undefined && data.qualityScore !== null) {
    const score = Number(data.qualityScore);
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      throw new ValidationError('Поле qualityScore должно быть целым числом от 1 до 5');
    }
  }

  const sleepLog = await SleepLog.create({ ...data, userId });
  return sleepLog;
}

/**
 * Получить список записей дневника сна пользователя.
 * Возвращает только записи пользователя, отсортированные по sleepAt DESC.
 * Requirement 7.5
 * @param {string} userId - Идентификатор пользователя
 * @param {number} [limit=20] - Максимальное количество записей
 * @param {number} [offset=0] - Смещение для пагинации
 * @returns {Promise<SleepLog[]>} Массив записей
 */
async function listSleepLogs(userId, limit = 20, offset = 0) {
  const sleepLogs = await SleepLog.findAll({
    where: { userId },
    order: [['sleepAt', 'DESC']],
    limit,
    offset,
  });

  return sleepLogs;
}

/**
 * Получить запись дневника сна по id.
 * Requirement 7.6, 7.7
 * @param {string} userId - Идентификатор пользователя
 * @param {string} id - Идентификатор записи
 * @returns {Promise<SleepLog>} Найденная запись
 * @throws {NotFoundError} Если запись не найдена
 * @throws {ForbiddenError} Если запись принадлежит другому пользователю
 */
async function getSleepLogById(userId, id) {
  const sleepLog = await SleepLog.findByPk(id);

  if (!sleepLog) {
    throw new NotFoundError(`Запись сна с id ${id} не найдена`);
  }

  if (sleepLog.userId !== userId) {
    throw new ForbiddenError('Доступ к чужой записи сна запрещён');
  }

  return sleepLog;
}

/**
 * Обновить запись дневника сна.
 * Проверяет, что запись принадлежит пользователю.
 * Requirement 7.6, 7.7
 * @param {string} userId - Идентификатор пользователя
 * @param {string} id - Идентификатор записи
 * @param {object} data - Обновляемые данные
 * @returns {Promise<SleepLog>} Обновлённая запись
 * @throws {NotFoundError} Если запись не найдена
 * @throws {ForbiddenError} Если запись принадлежит другому пользователю
 */
async function updateSleepLog(userId, id, data) {
  const sleepLog = await SleepLog.findByPk(id);

  if (!sleepLog) {
    throw new NotFoundError(`Запись сна с id ${id} не найдена`);
  }

  if (sleepLog.userId !== userId) {
    throw new ForbiddenError('Доступ к чужой записи сна запрещён');
  }

  await sleepLog.update(data);
  return sleepLog;
}

/**
 * Удалить запись дневника сна.
 * Проверяет, что запись принадлежит пользователю.
 * Requirement 7.8
 * @param {string} userId - Идентификатор пользователя
 * @param {string} id - Идентификатор записи
 * @returns {Promise<void>}
 * @throws {NotFoundError} Если запись не найдена
 * @throws {ForbiddenError} Если запись принадлежит другому пользователю
 */
async function deleteSleepLog(userId, id) {
  const sleepLog = await SleepLog.findByPk(id);

  if (!sleepLog) {
    throw new NotFoundError(`Запись сна с id ${id} не найдена`);
  }

  if (sleepLog.userId !== userId) {
    throw new ForbiddenError('Доступ к чужой записи сна запрещён');
  }

  await sleepLog.destroy();
}

/**
 * Получить статистику сна пользователя за период.
 * Вычисляет среднюю продолжительность, среднюю оценку и среднее число пробуждений.
 * Requirement 7.9
 * @param {string} userId - Идентификатор пользователя
 * @param {string|Date} startDate - Начало периода
 * @param {string|Date} endDate - Конец периода
 * @returns {Promise<{avgDurationHours: number|null, avgQualityScore: number|null, avgAwakenings: number|null}>}
 */
async function getSleepStats(userId, startDate, endDate) {
  const sleepLogs = await SleepLog.findAll({
    where: {
      userId,
      sleepAt: {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      },
    },
  });

  if (sleepLogs.length === 0) {
    return {
      avgDurationHours: null,
      avgQualityScore: null,
      avgAwakenings: null,
    };
  }

  // Средняя продолжительность сна в часах
  const totalDurationHours = sleepLogs.reduce((sum, log) => {
    const durationMs = new Date(log.wakeAt) - new Date(log.sleepAt);
    return sum + durationMs / (1000 * 60 * 60);
  }, 0);
  const avgDurationHours = totalDurationHours / sleepLogs.length;

  // Средняя оценка качества (игнорируем null)
  const qualityLogs = sleepLogs.filter((log) => log.qualityScore !== null && log.qualityScore !== undefined);
  const avgQualityScore =
    qualityLogs.length > 0
      ? qualityLogs.reduce((sum, log) => sum + log.qualityScore, 0) / qualityLogs.length
      : null;

  // Среднее число пробуждений (игнорируем null)
  const awakeningsLogs = sleepLogs.filter((log) => log.awakenings !== null && log.awakenings !== undefined);
  const avgAwakenings =
    awakeningsLogs.length > 0
      ? awakeningsLogs.reduce((sum, log) => sum + log.awakenings, 0) / awakeningsLogs.length
      : null;

  return {
    avgDurationHours,
    avgQualityScore,
    avgAwakenings,
  };
}

module.exports = {
  createSleepLog,
  listSleepLogs,
  getSleepLogById,
  updateSleepLog,
  deleteSleepLog,
  getSleepStats,
};
