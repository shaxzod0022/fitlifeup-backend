'use strict';

const { Op } = require('sequelize');
const { WorkoutProgram, ProgramSet, WorkoutSet, SetItem, Exercise } = require('../models/index');
const { NotFoundError, ForbiddenError, UnprocessableError } = require('../utils/errors');

/**
 * Вычисляет суммарное время программы как сумму __total_time__ всех сетов.
 * Validates: Requirements 3.2
 *
 * @param {Array} sets - Сеты с полем __total_time__
 * @returns {number} Суммарное время в минутах
 */
function calculateProgramTotalTime(sets) {
  if (!sets || sets.length === 0) return 0;
  return sets.reduce((total, set) => total + (set.__total_time__ || 0), 0);
}

/**
 * Создать программу.
 * Проверяет доступность сетов для пользователя.
 * Validates: Requirements 3.3, 3.5
 *
 * @param {string} userId - Идентификатор пользователя
 * @param {object} data - Данные программы (name, image, subtitle, tags, level, visibility, sets)
 * @returns {Promise<WorkoutProgram>} Созданная программа с сетами
 */
async function createProgram(userId, data, userRole = 'user') {
  const { sets: setIds = [], ...programData } = data;

  // Проверяем доступность всех сетов
  if (setIds.length > 0) {
    const sets = await WorkoutSet.findAll({ where: { id: setIds } });

    for (const setId of setIds) {
      const workoutSet = sets.find((s) => s.id === setId);
      if (!workoutSet) {
        throw new NotFoundError(`Сет с id ${setId} не найден`);
      }
      if (userRole !== 'admin' && workoutSet.visibility === 'private' && workoutSet.creatorId !== userId) {
        throw new UnprocessableError(
          `Сет с id ${setId} является приватным и принадлежит другому пользователю`
        );
      }
    }
  }

  // Создаём программу
  const program = await WorkoutProgram.create({ ...programData, creatorId: userId });

  // Создаём связи программы с сетами
  if (setIds.length > 0) {
    const programSets = setIds.map((setId, index) => ({
      programId: program.id,
      setId,
      order: index,
    }));
    await ProgramSet.bulkCreate(programSets);
  }

  // Загружаем программу с сетами для вычисления времени
  const programWithSets = await WorkoutProgram.findByPk(program.id, {
    include: [
      {
        model: ProgramSet,
        as: 'programSets',
        include: [
          {
            model: WorkoutSet,
            as: undefined,
            foreignKey: 'setId',
          },
        ],
      },
    ],
  });

  // Получаем сеты для вычисления времени
  const setsForTime = await WorkoutSet.findAll({ where: { id: setIds } });
  const totalTime = calculateProgramTotalTime(setsForTime);
  await program.update({ __total_time__: totalTime });

  return programWithSets;
}

/**
 * Получить список программ.
 * Возвращает публичные программы (из каталога Admin) и собственные программы пользователя.
 * Validates: Requirements 3.4
 *
 * @param {string} userId - Идентификатор пользователя
 * @returns {Promise<WorkoutProgram[]>} Список программ
 */
async function listPrograms(userId, userRole = 'user') {
  const whereClause = userRole === 'admin'
    ? {}
    : {
        [Op.or]: [
          { visibility: 'public' },
          { creatorId: userId },
        ],
      };

  const programs = await WorkoutProgram.findAll({
    where: whereClause,
    include: [
      {
        model: ProgramSet,
        as: 'programSets',
      },
    ],
  });
  return programs;
}

/**
 * Получить программу по id.
 * Validates: Requirements 3.4
 *
 * @param {string} userId - Идентификатор пользователя
 * @param {string} id - Идентификатор программы
 * @returns {Promise<WorkoutProgram>} Программа
 * @throws {NotFoundError} Если программа не найдена
 * @throws {ForbiddenError} Если программа приватная и принадлежит другому пользователю
 */
async function getProgramById(userId, id, userRole = 'user') {
  const program = await WorkoutProgram.findByPk(id, {
    include: [
      {
        model: ProgramSet,
        as: 'programSets',
      },
    ],
  });

  if (!program) {
    throw new NotFoundError(`Программа с id ${id} не найдена`);
  }

  if (userRole !== 'admin' && program.visibility === 'private' && program.creatorId !== userId) {
    throw new ForbiddenError('Доступ к приватной программе запрещён');
  }

  return program;
}

/**
 * Обновить программу.
 * Пересчитывает __total_time__ после обновления.
 * Validates: Requirements 3.6, 3.7
 *
 * @param {string} userId - Идентификатор пользователя
 * @param {string} id - Идентификатор программы
 * @param {object} data - Данные для обновления
 * @returns {Promise<WorkoutProgram>} Обновлённая программа
 * @throws {NotFoundError} Если программа не найдена
 * @throws {ForbiddenError} Если пользователь не является владельцем
 */
async function updateProgram(userId, id, data, userRole = 'user') {
  const program = await WorkoutProgram.findByPk(id);

  if (!program) {
    throw new NotFoundError(`Программа с id ${id} не найдена`);
  }

  if (userRole !== 'admin' && program.creatorId !== userId) {
    throw new ForbiddenError('Нет прав для изменения чужой программы');
  }

  const { sets: setIds, ...programData } = data;

  // Обновляем основные данные программы
  await program.update(programData);

  // Если переданы сеты — обновляем их
  if (setIds !== undefined) {
    if (setIds.length > 0) {
      const sets = await WorkoutSet.findAll({ where: { id: setIds } });

      for (const setId of setIds) {
        const workoutSet = sets.find((s) => s.id === setId);
        if (!workoutSet) {
          throw new NotFoundError(`Сет с id ${setId} не найден`);
        }
        if (userRole !== 'admin' && workoutSet.visibility === 'private' && workoutSet.creatorId !== userId) {
          throw new UnprocessableError(
            `Сет с id ${setId} является приватным и принадлежит другому пользователю`
          );
        }
      }
    }

    // Удаляем старые связи и создаём новые
    await ProgramSet.destroy({ where: { programId: id } });
    if (setIds.length > 0) {
      const programSets = setIds.map((setId, index) => ({
        programId: id,
        setId,
        order: index,
      }));
      await ProgramSet.bulkCreate(programSets);
    }

    // Пересчитываем суммарное время
    const setsForTime = await WorkoutSet.findAll({ where: { id: setIds } });
    const totalTime = calculateProgramTotalTime(setsForTime);
    await program.update({ __total_time__: totalTime });
  }

  // Загружаем обновлённую программу
  const updatedProgram = await WorkoutProgram.findByPk(id, {
    include: [
      {
        model: ProgramSet,
        as: 'programSets',
      },
    ],
  });

  return updatedProgram;
}

/**
 * Удалить программу.
 * Validates: Requirements 3.7, 3.8
 *
 * @param {string} userId - Идентификатор пользователя
 * @param {string} id - Идентификатор программы
 * @returns {Promise<void>}
 * @throws {NotFoundError} Если программа не найдена
 * @throws {ForbiddenError} Если пользователь не является владельцем
 */
async function deleteProgram(userId, id, userRole = 'user') {
  const program = await WorkoutProgram.findByPk(id);

  if (!program) {
    throw new NotFoundError(`Программа с id ${id} не найдена`);
  }

  if (userRole !== 'admin' && program.creatorId !== userId) {
    throw new ForbiddenError('Нет прав для удаления чужой программы');
  }

  await program.destroy();
}

module.exports = {
  calculateProgramTotalTime,
  createProgram,
  listPrograms,
  getProgramById,
  updateProgram,
  deleteProgram,
};
