const { Sequelize } = require('sequelize');
const path = require('path');

// Путь к SQLite-файлу: из переменной окружения или по умолчанию в корне проекта
const dbPath = process.env.DB_PATH || path.resolve(__dirname, '../../database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false,
});

module.exports = sequelize;
