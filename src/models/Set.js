'use strict';

const { DataTypes, Model } = require('sequelize');

/**
 * Модель тренировочного сета (набора упражнений).
 * Используется имя WorkoutSet во избежание конфликта с встроенным Set в JS.
 */
class WorkoutSet extends Model {}

/**
 * Инициализирует модель WorkoutSet с заданным экземпляром Sequelize.
 * @param {import('sequelize').Sequelize} sequelize
 */
function initWorkoutSet(sequelize) {
  WorkoutSet.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tags: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      level: {
        type: DataTypes.STRING,
      },
      visibility: {
        type: DataTypes.ENUM('public', 'private'),
        defaultValue: 'private',
      },
      creatorId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      __total_time__: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: 'WorkoutSet',
      tableName: 'Sets',
    }
  );

  return WorkoutSet;
}

module.exports = { WorkoutSet, initWorkoutSet };
