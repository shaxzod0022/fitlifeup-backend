'use strict';

const { DataTypes, Model } = require('sequelize');

/**
 * Модель дневника питания.
 * Представляет запись о приёме пищи за конкретную дату.
 */
class MealLog extends Model {}

/**
 * Инициализирует модель MealLog с заданным экземпляром Sequelize.
 * @param {import('sequelize').Sequelize} sequelize
 */
function initMealLog(sequelize) {
  MealLog.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      mealType: {
        type: DataTypes.ENUM(
          'breakfast',
          'lunch',
          'dinner',
          'afternoon_snack',
          'evening_snack',
          'custom'
        ),
        allowNull: false,
      },
      customMealName: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: 'MealLog',
      tableName: 'MealLogs',
      indexes: [
        {
          unique: true,
          fields: ['userId', 'date', 'mealType'],
        },
      ],
    }
  );

  return MealLog;
}

module.exports = { MealLog, initMealLog };
