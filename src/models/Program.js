'use strict';

const { DataTypes, Model } = require('sequelize');

/**
 * Модель тренировочной программы (Programma).
 * Используется имя WorkoutProgram для ясности.
 */
class WorkoutProgram extends Model {}

/**
 * Инициализирует модель WorkoutProgram с заданным экземпляром Sequelize.
 * @param {import('sequelize').Sequelize} sequelize
 */
function initWorkoutProgram(sequelize) {
  WorkoutProgram.init(
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
      image: {
        type: DataTypes.STRING,
      },
      subtitle: {
        type: DataTypes.STRING,
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
      modelName: 'WorkoutProgram',
      tableName: 'Programs',
    }
  );

  return WorkoutProgram;
}

module.exports = { WorkoutProgram, initWorkoutProgram };
