'use strict';

const { DataTypes, Model } = require('sequelize');

/**
 * BlacklistedToken model for JWT authentication.
 * Stores blacklisted tokens for logout functionality.
 */
class BlacklistedToken extends Model {
  /**
   * Static method to remove expired blacklisted tokens from the database.
   * This should be called periodically to prevent database bloat.
   * @returns {Promise<number>} Number of tokens deleted
   */
  static async cleanup() {
    const now = new Date();
    const result = await BlacklistedToken.destroy({
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
 * Initializes the BlacklistedToken model with the given Sequelize instance.
 * @param {import('sequelize').Sequelize} sequelize
 */
function initBlacklistedToken(sequelize) {
  BlacklistedToken.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      token: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
      },
      blacklistedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'BlacklistedToken',
      tableName: 'BlacklistedTokens',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['token'],
        },
        {
          fields: ['expiresAt'],
        },
      ],
    }
  );

  return BlacklistedToken;
}

module.exports = { BlacklistedToken, initBlacklistedToken };
