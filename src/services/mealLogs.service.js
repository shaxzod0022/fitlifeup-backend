'use strict';

const { MealLog, MealEntry, Dish } = require('../models/index');
const { NotFoundError, ForbiddenError, ConflictError } = require('../utils/errors');

/**
 * Создать запись дневника питания (MealLog).
 * Проверяет уникальность комбинации (userId, date, mealType).
 * Requirement 6.7, 6.8
 * @param {string} userId - Идентификатор пользователя
 * @param {object} data - Данные записи (date, mealType, customMealName)
 * @returns {Promise<MealLog>} Созданная запись
 * @throws {ConflictError} Если запись с такой комбинацией уже существует
 */
async function createMealLog(userId, data) {
  const existing = await MealLog.findOne({
    where: {
      userId,
      date: data.date,
      mealType: data.mealType,
    },
  });

  if (existing) {
    throw new ConflictError(
      `Запись питания для типа "${data.mealType}" на дату ${data.date} уже существует`
    );
  }

  const mealLog = await MealLog.create({ ...data, userId });
  return mealLog;
}

/**
 * Получить запись дневника питания по id.
 * Requirement 6.6
 * @param {string} userId - Идентификатор пользователя
 * @param {string} mealLogId - Идентификатор записи
 * @returns {Promise<MealLog>} Запись с вложенными MealEntry и данными блюда
 * @throws {NotFoundError} Если запись не найдена
 * @throws {ForbiddenError} Если запись принадлежит другому пользователю
 */
async function getMealLogById(userId, mealLogId) {
  const mealLog = await MealLog.findByPk(mealLogId, {
    include: [
      {
        model: MealEntry,
        as: 'entries',
        include: [
          {
            model: Dish,
            as: 'dish',
          },
        ],
      },
    ],
  });

  if (!mealLog) {
    throw new NotFoundError(`Запись питания с id ${mealLogId} не найдена`);
  }

  if (mealLog.userId !== userId) {
    throw new ForbiddenError('Доступ к чужой записи питания запрещён');
  }

  return mealLog;
}

/**
 * Добавить позицию в запись дневника питания (MealEntry).
 * При useSnapshot = true копирует данные блюда в поле snapshot.
 * Requirement 6.4, 6.5
 * @param {string} mealLogId - Идентификатор записи дневника питания
 * @param {object} data - Данные позиции (dishId/blyudoId, useSnapshot, portionGrams)
 * @returns {Promise<MealEntry>} Созданная позиция
 * @throws {NotFoundError} Если запись дневника или блюдо не найдено
 */
async function addMealEntry(mealLogId, data) {
  const mealLog = await MealLog.findByPk(mealLogId);

  if (!mealLog) {
    throw new NotFoundError(`Запись питания с id ${mealLogId} не найдена`);
  }

  // Поддержка как dishId, так и blyudoId (алиас из задания)
  const dishId = data.dishId || data.blyudoId;
  let snapshot = null;

  if (data.useSnapshot === true && dishId) {
    const dish = await Dish.findByPk(dishId);

    if (!dish) {
      throw new NotFoundError(`Блюдо с id ${dishId} не найдено`);
    }

    // Копируем данные блюда в snapshot
    snapshot = {
      name: dish.name,
      protein: dish.protein,
      carbohydrate: dish.carbohydrate,
      fat: dish.fat,
      description: dish.description,
      image: dish.image,
    };
  }

  const entry = await MealEntry.create({
    mealLogId,
    dishId: dishId || null,
    useSnapshot: data.useSnapshot || false,
    snapshot,
    portionGrams: data.portionGrams || null,
  });

  return entry;
}

/**
 * Получить все записи дневника питания пользователя за дату.
 * Requirement 6.6
 * @param {string} userId - Идентификатор пользователя
 * @param {string} date - Дата в формате YYYY-MM-DD
 * @returns {Promise<MealLog[]>} Массив записей с вложенными MealEntry и данными блюда
 */
async function getMealLogsByDate(userId, date) {
  const mealLogs = await MealLog.findAll({
    where: { userId, date },
    include: [
      {
        model: MealEntry,
        as: 'entries',
        include: [
          {
            model: Dish,
            as: 'dish',
          },
        ],
      },
    ],
  });

  return mealLogs;
}

/**
 * Получить сводку питания пользователя за дату.
 * Суммирует protein, carbohydrate, fat по всем MealEntry за день.
 * Если useSnapshot = true, использует данные из snapshot; иначе — из связанного блюда.
 * Requirement 6.9
 * @param {string} userId - Идентификатор пользователя
 * @param {string} date - Дата в формате YYYY-MM-DD
 * @returns {Promise<{protein: number, carbohydrate: number, fat: number}>} Сводка макронутриентов
 */
async function getNutritionSummary(userId, date) {
  const mealLogs = await MealLog.findAll({
    where: { userId, date },
    include: [
      {
        model: MealEntry,
        as: 'entries',
        include: [
          {
            model: Dish,
            as: 'dish',
          },
        ],
      },
    ],
  });

  let protein = 0;
  let carbohydrate = 0;
  let fat = 0;

  for (const mealLog of mealLogs) {
    for (const entry of mealLog.entries) {
      let source = null;

      if (entry.useSnapshot && entry.snapshot) {
        source = entry.snapshot;
      } else if (entry.dish) {
        source = entry.dish;
      }

      if (source) {
        protein += source.protein || 0;
        carbohydrate += source.carbohydrate || 0;
        fat += source.fat || 0;
      }
    }
  }

  return { protein, carbohydrate, fat };
}

module.exports = {
  createMealLog,
  getMealLogById,
  addMealEntry,
  getMealLogsByDate,
  getNutritionSummary,
};
