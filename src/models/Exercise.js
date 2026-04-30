'use strict';

const { DataTypes, Model } = require('sequelize');

/**
 * Модель упражнения (Zanyatie).
 * Представляет отдельное упражнение в системе.
 */
class Exercise extends Model {}

/**
 * Инициализирует модель Exercise (Zanyatie) с заданным экземпляром Sequelize.
 * @param {import('sequelize').Sequelize} sequelize
 */
function initExercise(sequelize) {
  Exercise.init(
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
      subtitle: {
        type: DataTypes.STRING,
      },
      tags: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      description: {
        type: DataTypes.TEXT,
      },
      image: {
        type: DataTypes.STRING,
      },
      time: {
        type: DataTypes.FLOAT,
      },
      visibility: {
        type: DataTypes.ENUM('public', 'private'),
        defaultValue: 'private',
      },
      creatorId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Exercise',
      tableName: 'Exercises',
    }
  );

  return Exercise;
}

module.exports = { Exercise, initExercise };
