'use strict';

const { DataTypes, Model } = require('sequelize');

/**
 * Permission model for RBAC.
 */
class Permission extends Model {}

/**
 * Initializes the Permission model.
 * @param {import('sequelize').Sequelize} sequelize
 */
function initPermission(sequelize) {
  Permission.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING,
        defaultValue: 'general',
      },
    },
    {
      sequelize,
      modelName: 'Permission',
      tableName: 'Permissions',
      timestamps: true,
    }
  );

  return Permission;
}

module.exports = { Permission, initPermission };
