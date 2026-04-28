'use strict';

const { Op } = require('sequelize');
const { Dish } = require('../models/index');
const { NotFoundError, ForbiddenError } = require('../utils/errors');

/**
 * Создать блюдо.
 * Requirement 5.2
 * @param {string} userId - Идентификатор пользователя
 * @param {object} data - Данные блюда
 * @returns {Promise<Dish>} Созданное блюдо
 */
async function createDish(userId, data, userRole = 'user') {
  const dish = await Dish.create({ ...data, creatorId: userId });
  return dish;
}

/**
 * Получить список блюд.
 * Возвращает публичные блюда (из каталога Admin) и собственные блюда пользователя.
 * Requirement 5.3
 * @param {string} userId - Идентификатор пользователя
 * @returns {Promise<Dish[]>} Список блюд
 */
async function listDishes(userId, userRole = 'user') {
  const whereClause = userRole === 'admin'
    ? {}
    : {
        [Op.or]: [
          { visibility: 'public' },
          { creatorId: userId },
        ],
      };

  const dishes = await Dish.findAll({
    where: whereClause,
  });
  return dishes;
}

/**
 * Получить блюдо по id.
 * Requirement 5.3, 5.5
 * @param {string} userId - Идентификатор пользователя
 * @param {string} id - Идентификатор блюда
 * @returns {Promise<Dish>} Блюдо
 * @throws {NotFoundError} Если блюдо не найдено
 * @throws {ForbiddenError} Если блюдо приватное и принадлежит другому пользователю
 */
async function getDishById(userId, id, userRole = 'user') {
  const dish = await Dish.findByPk(id);

  if (!dish) {
    throw new NotFoundError(`Блюдо с id ${id} не найдено`);
  }

  if (userRole !== 'admin' && dish.visibility === 'private' && dish.creatorId !== userId) {
    throw new ForbiddenError('Доступ к приватному блюду запрещён');
  }

  return dish;
}

/**
 * Обновить блюдо.
 * Requirement 5.4, 5.5
 * @param {string} userId - Идентификатор пользователя
 * @param {string} id - Идентификатор блюда
 * @param {object} data - Данные для обновления
 * @returns {Promise<Dish>} Обновлённое блюдо
 * @throws {NotFoundError} Если блюдо не найдено
 * @throws {ForbiddenError} Если пользователь не является владельцем
 */
async function updateDish(userId, id, data, userRole = 'user') {
  const dish = await Dish.findByPk(id);

  if (!dish) {
    throw new NotFoundError(`Блюдо с id ${id} не найдено`);
  }

  if (userRole !== 'admin' && dish.creatorId !== userId) {
    throw new ForbiddenError('Нет прав для изменения чужого блюда');
  }

  await dish.update(data);
  return dish;
}

/**
 * Удалить блюдо.
 * Requirement 5.5, 5.6
 * @param {string} userId - Идентификатор пользователя
 * @param {string} id - Идентификатор блюда
 * @returns {Promise<void>}
 * @throws {NotFoundError} Если блюдо не найдено
 * @throws {ForbiddenError} Если пользователь не является владельцем
 */
async function deleteDish(userId, id, userRole = 'user') {
  const dish = await Dish.findByPk(id);

  if (!dish) {
    throw new NotFoundError(`Блюдо с id ${id} не найдено`);
  }

  if (userRole !== 'admin' && dish.creatorId !== userId) {
    throw new ForbiddenError('Нет прав для удаления чужого блюда');
  }

  await dish.destroy();
}

module.exports = {
  createDish,
  listDishes,
  getDishById,
  updateDish,
  deleteDish,
};
