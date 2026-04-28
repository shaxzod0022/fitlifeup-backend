'use strict';

const { DataTypes, Model } = require('sequelize');

/**
 * Модель дневника сна.
 * Представляет запись о периоде сна пользователя.
 */
class SleepLog extends Model {}

/**
 * Инициализирует модель SleepLog с заданным экземпляром Sequelize.
 * @param {import('sequelize').Sequelize} sequelize
 */
function initSleepLog(sequelize) {
  SleepLog.init(
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
      sleepAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      wakeAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      qualityScore: {
        type: DataTypes.INTEGER,
      },
      awakenings: {
        type: DataTypes.INTEGER,
      },
    },
    {
      sequelize,
      modelName: 'SleepLog',
      tableName: 'SleepLogs',
    }
  );

  return SleepLog;
}

module.exports = { SleepLog, initSleepLog };
