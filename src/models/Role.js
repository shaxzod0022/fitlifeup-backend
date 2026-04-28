'use strict';

const { DataTypes, Model } = require('sequelize');

/**
 * Role model for RBAC.
 */
class Role extends Model {}

/**
 * Initializes the Role model.
 * @param {import('sequelize').Sequelize} sequelize
 */
function initRole(sequelize) {
  Role.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: 'Role',
      tableName: 'Roles',
      timestamps: true,
    }
  );

  return Role;
}

module.exports = { Role, initRole };
