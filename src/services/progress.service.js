'use strict';

const { Op } = require('sequelize');
const { CompletedSet, CompletedProgram } = require('../models/index');

/**
 * Отметить сет как завершённый.
 * Создаёт запись CompletedSet для пользователя.
 * Requirement 4.3
 * @param {string} userId - Идентификатор пользователя
 * @param {string} setId - Идентификатор сета
 * @param {object} data - Дополнительные данные (durationMinutes)
 * @returns {Promise<CompletedSet>} Созданная запись
 */
async function completeSet(userId, setId, data) {
  const completedSet = await CompletedSet.create({
    userId,
    setId,
    completedAt: new Date(),
    durationMinutes: data.durationMinutes || null,
  });

  return completedSet;
}

/**
 * Отметить программу как завершённую.
 * Создаёт запись CompletedProgram для пользователя.
 * Requirement 4.4
 * @param {string} userId - Идентификатор пользователя
 * @param {string} programId - Идентификатор программы
 * @param {object} data - Дополнительные данные (durationMinutes)
 * @returns {Promise<CompletedProgram>} Созданная запись
 */
async function completeProgram(userId, programId, data) {
  const completedProgram = await CompletedProgram.create({
    userId,
    programId,
    completedAt: new Date(),
    durationMinutes: data.durationMinutes || null,
  });

  return completedProgram;
}

/**
 * Получить статистику прогресса пользователя.
 * Возвращает общее количество завершённых сетов и программ,
 * а также количество тренировочных дней за 7 и 30 дней.
 * Requirement 4.5
 * @param {string} userId - Идентификатор пользователя
 * @returns {Promise<{totalCompletedSets: number, totalCompletedPrograms: number, trainingDaysLast7: number, trainingDaysLast30: number}>}
 */
async function getProgressStats(userId) {
  const now = new Date();

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Общее количество завершённых сетов
  const totalCompletedSets = await CompletedSet.count({ where: { userId } });

  // Общее количество завершённых программ
  const totalCompletedPrograms = await CompletedProgram.count({ where: { userId } });

  // Вспомогательная функция: получить уникальные даты тренировок за период
  const getUniqueDates = async (since) => {
    const [sets, programs] = await Promise.all([
      CompletedSet.findAll({
        where: {
          userId,
          completedAt: { [Op.gte]: since },
        },
        attributes: ['completedAt'],
      }),
      CompletedProgram.findAll({
        where: {
          userId,
          completedAt: { [Op.gte]: since },
        },
        attributes: ['completedAt'],
      }),
    ]);

    const allDates = [...sets, ...programs].map((record) => {
      const d = new Date(record.completedAt);
      // Нормализуем до даты без времени (YYYY-MM-DD)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });

    return new Set(allDates).size;
  };

  const [trainingDaysLast7, trainingDaysLast30] = await Promise.all([
    getUniqueDates(sevenDaysAgo),
    getUniqueDates(thirtyDaysAgo),
  ]);

  return {
    totalCompletedSets,
    totalCompletedPrograms,
    trainingDaysLast7,
    trainingDaysLast30,
  };
}

/**
 * Получить историю завершений пользователя.
 * Объединяет завершённые сеты и программы, сортирует по completedAt DESC.
 * Поддерживает пагинацию через limit и offset.
 * Requirement 4.6
 * @param {string} userId - Идентификатор пользователя
 * @param {number} [limit=20] - Максимальное количество записей
 * @param {number} [offset=0] - Смещение для пагинации
 * @returns {Promise<Array>} Массив записей истории завершений
 */
async function getCompletionHistory(userId, limit = 20, offset = 0) {
  const [completedSets, completedPrograms] = await Promise.all([
    CompletedSet.findAll({
      where: { userId },
      attributes: ['id', 'userId', 'setId', 'completedAt', 'durationMinutes'],
    }),
    CompletedProgram.findAll({
      where: { userId },
      attributes: ['id', 'userId', 'programId', 'completedAt', 'durationMinutes'],
    }),
  ]);

  // Нормализуем записи с типом
  const setsWithType = completedSets.map((record) => ({
    type: 'set',
    id: record.id,
    userId: record.userId,
    setId: record.setId,
    completedAt: record.completedAt,
    durationMinutes: record.durationMinutes,
  }));

  const programsWithType = completedPrograms.map((record) => ({
    type: 'program',
    id: record.id,
    userId: record.userId,
    programId: record.programId,
    completedAt: record.completedAt,
    durationMinutes: record.durationMinutes,
  }));

  // Объединяем и сортируем по completedAt DESC
  const merged = [...setsWithType, ...programsWithType].sort(
    (a, b) => new Date(b.completedAt) - new Date(a.completedAt)
  );

  // Применяем пагинацию
  return merged.slice(offset, offset + limit);
}

module.exports = {
  completeSet,
  completeProgram,
  getProgressStats,
  getCompletionHistory,
};
