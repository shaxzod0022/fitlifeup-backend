'use strict';

const { DataTypes, Model } = require('sequelize');

/**
 * Модель элемента сета.
 * Связывает тренировочный сет (WorkoutSet) с упражнением (Exercise/Zanyatie).
 */
class SetItem extends Model {}

/**
 * Инициализирует модель SetItem с заданным экземпляром Sequelize.
 * @param {import('sequelize').Sequelize} sequelize
 */
function initSetItem(sequelize) {
  SetItem.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      setId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      exerciseId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      count: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      break: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      repeats: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: 'SetItem',
      tableName: 'SetItems',
    }
  );

  return SetItem;
}

module.exports = { SetItem, initSetItem };
