'use strict';

const { DataTypes, Model } = require('sequelize');

/**
 * Модель блюда (Blyudo).
 * Представляет блюдо с информацией о питательной ценности.
 */
class Dish extends Model {}

/**
 * Инициализирует модель Dish (Blyudo) с заданным экземпляром Sequelize.
 * @param {import('sequelize').Sequelize} sequelize
 */
function initDish(sequelize) {
  Dish.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
      image: {
        type: DataTypes.STRING,
      },
      visibility: {
        type: DataTypes.ENUM('public', 'private'),
        defaultValue: 'private',
      },
      tags: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      creatorId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      protein: {
        type: DataTypes.FLOAT,
      },
      carbohydrate: {
        type: DataTypes.FLOAT,
      },
      fat: {
        type: DataTypes.FLOAT,
      },
    },
    {
      sequelize,
      modelName: 'Dish',
      tableName: 'Dish',
    }
  );

  return Dish;
}

module.exports = { Dish, initDish };
