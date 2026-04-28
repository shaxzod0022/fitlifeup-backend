'use strict';

const { DataTypes, Model } = require('sequelize');

/**
 * Модель элемента программы.
 * Связывает тренировочную программу (WorkoutProgram) с сетом (WorkoutSet).
 */
class ProgramSet extends Model {}

/**
 * Инициализирует модель ProgramSet с заданным экземпляром Sequelize.
 * @param {import('sequelize').Sequelize} sequelize
 */
function initProgramSet(sequelize) {
  ProgramSet.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      programId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      setId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: 'ProgramSet',
      tableName: 'ProgramSets',
    }
  );

  return ProgramSet;
}

module.exports = { ProgramSet, initProgramSet };
