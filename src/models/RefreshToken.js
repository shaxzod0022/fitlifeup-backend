'use strict';

const { DataTypes, Model } = require('sequelize');

/**
 * RefreshToken model for JWT authentication.
 * Stores refresh tokens for token validation and rotation.
 */
class RefreshToken extends Model {
  /**
   * Static method to remove expired refresh tokens from the database.
   * This should be called periodically to prevent database bloat.
   * @returns {Promise<number>} Number of tokens deleted
   */
  static async cleanup() {
    const now = new Date();
    const result = await RefreshToken.destroy({
      where: {
        expiresAt: {
          [require('sequelize').Op.lt]: now,
        },
      },
    });
    return result;
  }
}

/**
 * Initializes the RefreshToken model with the given Sequelize instance.
 * @param {import('sequelize').Sequelize} sequelize
 */
function initRefreshToken(sequelize) {
  RefreshToken.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      token: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'RefreshToken',
      tableName: 'RefreshTokens',
      timestamps: true,
      indexes: [
        {
          fields: ['token'],
        },
        {
          fields: ['expiresAt'],
        },
        {
          fields: ['userId'],
        },
      ],
    }
  );

  return RefreshToken;
}

module.exports = { RefreshToken, initRefreshToken };
