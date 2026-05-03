'use strict';

const { Op } = require('sequelize');
const { WorkoutSet, SetItem, ProgramSet, Exercise } = require('../models/index');
const { NotFoundError, ForbiddenError, UnprocessableError } = require('../utils/errors');

/**
 * Вычисляет суммарное время сета.
 * Формула: sum((exercise.time × count × repeats) + (count × break × repeats))
 * Validates: Requirements 2.2
 *
 * @param {Array} items - Элементы сета с вложенными данными упражнения
 * @returns {number} Суммарное время в минутах
 */
function calculateTotalTime(items) {
  if (!items || items.length === 0) return 0;

  return items.reduce((total, item) => {
    const exerciseTime = item.time || 0;
    const count = item.count || 0;
    const repeats = item.repeats || 0;
    const breakTime = item.break || 0;

    const breakMinutes = breakTime / 60;
    const itemTime = (exerciseTime * count * repeats) + (count * breakMinutes * repeats);
    return total + itemTime;
  }, 0);
}

/**
 * Создать сет.
 * Проверяет доступность упражнений для пользователя.
 * Validates: Requirements 2.3, 2.5
 *
 * @param {string} userId - Идентификатор пользователя
 * @param {object} data - Данные сета (name, tags, level, visibility, items)
 * @returns {Promise<WorkoutSet>} Созданный сет с элементами
 */
async function createSet(userId, data, userRole = 'user') {
  const { items = [], ...setData } = data;

  // No exercise validation needed as they are defined inline

  // Создаём сет
  const workoutSet = await WorkoutSet.create({ ...setData, creatorId: userId });

  // Создаём элементы сета
  if (items.length > 0) {
    const setItems = items.map((item, index) => ({
      ...item,
      setId: workoutSet.id,
      order: item.order !== undefined ? item.order : index,
    }));
    await SetItem.bulkCreate(setItems);
  }

  // Загружаем сет с элементами и упражнениями для вычисления времени
  const setWithItems = await WorkoutSet.findByPk(workoutSet.id, {
    include: [
      {
        model: SetItem,
        as: 'items',
        include: [{ model: Exercise, as: 'exercise' }],
      },
    ],
  });

  // Вычисляем и сохраняем суммарное время
  const totalTime = calculateTotalTime(setWithItems.items);
  await workoutSet.update({ __total_time__: totalTime });
  setWithItems.__total_time__ = totalTime;

  return setWithItems;
}

/**
 * Получить список сетов.
 * Возвращает публичные сеты (из каталога Admin) и собственные сеты пользователя.
 * Validates: Requirements 2.4
 *
 * @param {string} userId - Идентификатор пользователя
 * @returns {Promise<WorkoutSet[]>} Список сетов
 */
async function listSets(userId, userRole = 'user') {
  const whereClause = userRole === 'admin'
    ? {}
    : {
        [Op.or]: [
          { visibility: 'public' },
          { creatorId: userId },
        ],
      };

  const sets = await WorkoutSet.findAll({
    where: whereClause,
    include: [
      {
        model: SetItem,
        as: 'items',
      },
      {
        model: require('../models').ExerciseCategory,
        as: 'category'
      }
    ],
  });
  return sets;
}

/**
 * Получить сет по id.
 * Validates: Requirements 2.4
 *
 * @param {string} userId - Идентификатор пользователя
 * @param {string} id - Идентификатор сета
 * @returns {Promise<WorkoutSet>} Сет
 * @throws {NotFoundError} Если сет не найден
 * @throws {ForbiddenError} Если сет приватный и принадлежит другому пользователю
 */
async function getSetById(userId, id, userRole = 'user') {
  const workoutSet = await WorkoutSet.findByPk(id, {
    include: [
      {
        model: SetItem,
        as: 'items',
      },
      {
        model: require('../models').ExerciseCategory,
        as: 'category'
      }
    ],
  });

  if (!workoutSet) {
    throw new NotFoundError(`Сет с id ${id} не найден`);
  }

  if (userRole !== 'admin' && userRole !== 'superadmin' && workoutSet.visibility === 'private' && workoutSet.creatorId !== userId) {
    throw new ForbiddenError('Доступ к приватному сету запрещён');
  }

  return workoutSet;
}

/**
 * Обновить сет.
 * Пересчитывает __total_time__ после обновления.
 * Validates: Requirements 2.6, 2.7
 *
 * @param {string} userId - Идентификатор пользователя
 * @param {string} id - Идентификатор сета
 * @param {object} data - Данные для обновления
 * @returns {Promise<WorkoutSet>} Обновлённый сет
 * @throws {NotFoundError} Если сет не найден
 * @throws {ForbiddenError} Если пользователь не является владельцем
 */
async function updateSet(userId, id, data, userRole = 'user') {
  const workoutSet = await WorkoutSet.findByPk(id);

  if (!workoutSet) {
    throw new NotFoundError(`Сет с id ${id} не найден`);
  }

  if (userRole !== 'admin' && userRole !== 'superadmin' && workoutSet.creatorId !== userId) {
    throw new ForbiddenError('Нет прав для изменения чужого сета');
  }

  const { items, ...setData } = data;

  // Обновляем основные данные сета
  await workoutSet.update(setData);

  // If items are provided, update them
  if (items !== undefined) {
    // Удаляем старые элементы и создаём новые
    await SetItem.destroy({ where: { setId: id } });
    if (items.length > 0) {
      const setItems = items.map((item, index) => ({
        ...item,
        setId: id,
        order: item.order !== undefined ? item.order : index,
      }));
      await SetItem.bulkCreate(setItems);
    }
  }

  // Загружаем обновлённый сет с элементами
  const updatedSet = await WorkoutSet.findByPk(id, {
    include: [
      {
        model: SetItem,
        as: 'items',
      },
    ],
  });

  // Пересчитываем суммарное время
  const totalTime = calculateTotalTime(updatedSet.items);
  await workoutSet.update({ __total_time__: totalTime });
  updatedSet.__total_time__ = totalTime;

  return updatedSet;
}

/**
 * Удалить сет.
 * Validates: Requirements 2.7, 2.8
 *
 * @param {string} userId - Идентификатор пользователя
 * @param {string} id - Идентификатор сета
 * @returns {Promise<void>}
 * @throws {NotFoundError} Если сет не найден
 * @throws {ForbiddenError} Если пользователь не является владельцем
 */
async function deleteSet(userId, id, userRole = 'user') {
  const workoutSet = await WorkoutSet.findByPk(id);

  if (!workoutSet) {
    throw new NotFoundError(`Сет с id ${id} не найден`);
  }

  if (userRole !== 'admin' && userRole !== 'superadmin' && workoutSet.creatorId !== userId) {
    throw new ForbiddenError('Нет прав для удаления чужого сета');
  }

  // Удаляем связанные элементы сета и связи с программами вручную для надёжности (особенно для SQLite)
  await SetItem.destroy({ where: { setId: id } });
  await ProgramSet.destroy({ where: { setId: id } });

  await workoutSet.destroy();
}

module.exports = {
  calculateTotalTime,
  createSet,
  listSets,
  getSetById,
  updateSet,
  deleteSet,
};
