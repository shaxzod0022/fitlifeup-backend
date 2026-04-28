'use strict';

const { DataTypes, Model } = require('sequelize');

/**
 * Модель позиции в дневнике питания.
 * Связывает запись о приёме пищи (MealLog) с блюдом (Dish/Blyudo).
 */
class MealEntry extends Model {}

/**
 * Инициализирует модель MealEntry с заданным экземпляром Sequelize.
 * @param {import('sequelize').Sequelize} sequelize
 */
function initMealEntry(sequelize) {
  MealEntry.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      mealLogId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      dishId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      snapshot: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      useSnapshot: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      portionGrams: {
        type: DataTypes.FLOAT,
      },
    },
    {
      sequelize,
      modelName: 'MealEntry',
      tableName: 'MealEntries',
    }
  );

  return MealEntry;
}

module.exports = { MealEntry, initMealEntry };
