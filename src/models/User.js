'use strict';

const { DataTypes, Model } = require('sequelize');

/**
 * User model for JWT authentication.
 * Stores user authentication credentials.
 */
class User extends Model {}

/**
 * Initializes the User model with the given Sequelize instance.
 * @param {import('sequelize').Sequelize} sequelize
 */
function initUser(sequelize) {
  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: {
            msg: 'Invalid email format',
          },
        },
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('user', 'admin'),
        defaultValue: 'user',
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'Users',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['email'],
        },
      ],
    }
  );

  return User;
}

module.exports = { User, initUser };
