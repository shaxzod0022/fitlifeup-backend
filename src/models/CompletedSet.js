'use strict';

const { DataTypes, Model } = require('sequelize');

/**
 * Модель завершённого сета.
 * Фиксирует факт выполнения тренировочного сета пользователем.
 */
class CompletedSet extends Model {}

/**
 * Инициализирует модель CompletedSet с заданным экземпляром Sequelize.
 * @param {import('sequelize').Sequelize} sequelize
 */
function initCompletedSet(sequelize) {
  CompletedSet.init(
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
      setId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      durationMinutes: {
        type: DataTypes.FLOAT,
      },
    },
    {
      sequelize,
      modelName: 'CompletedSet',
      tableName: 'CompletedSets',
    }
  );

  return CompletedSet;
}

module.exports = { CompletedSet, initCompletedSet };
