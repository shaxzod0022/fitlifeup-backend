'use strict';

const { DataTypes, Model } = require('sequelize');

/**
 * Модель завершённой программы.
 * Фиксирует факт выполнения тренировочной программы пользователем.
 */
class CompletedProgram extends Model {}

/**
 * Инициализирует модель CompletedProgram с заданным экземпляром Sequelize.
 * @param {import('sequelize').Sequelize} sequelize
 */
function initCompletedProgram(sequelize) {
  CompletedProgram.init(
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
      programId: {
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
      modelName: 'CompletedProgram',
      tableName: 'CompletedPrograms',
    }
  );

  return CompletedProgram;
}

module.exports = { CompletedProgram, initCompletedProgram };
