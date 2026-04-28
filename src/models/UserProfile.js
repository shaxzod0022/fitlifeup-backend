'use strict';

const { DataTypes, Model } = require('sequelize');

/**
 * Модель профиля пользователя.
 * Хранит персональные данные и фитнес-цели пользователя.
 */
class UserProfile extends Model {}

/**
 * Инициализирует модель UserProfile с заданным экземпляром Sequelize.
 * @param {import('sequelize').Sequelize} sequelize
 */
function initUserProfile(sequelize) {
  UserProfile.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: DataTypes.STRING,
      },
      phone: {
        type: DataTypes.STRING,
      },
      gender: {
        type: DataTypes.STRING,
      },
      age: {
        type: DataTypes.INTEGER,
      },
      height: {
        type: DataTypes.FLOAT,
      },
      weight: {
        type: DataTypes.FLOAT,
      },
      fitnessGoal: {
        type: DataTypes.ENUM(
          'weight_loss',
          'muscle_gain',
          'weight_maintenance',
          'rehabilitation'
        ),
      },
      workoutFrequency: {
        type: DataTypes.ENUM('low', 'medium', 'high'),
      },
    },
    {
      sequelize,
      modelName: 'UserProfile',
      tableName: 'UserProfiles',
    }
  );

  return UserProfile;
}

module.exports = { UserProfile, initUserProfile };
