'use strict';

const { DataTypes, Model } = require('sequelize');

class ExerciseCategory extends Model {}

function initExerciseCategory(sequelize) {
  ExerciseCategory.init(
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
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'ExerciseCategory',
      tableName: 'ExerciseCategories',
      timestamps: true,
    }
  );

  return ExerciseCategory;
}

module.exports = { ExerciseCategory, initExerciseCategory };
