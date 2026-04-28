'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const rootRouter = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Глобальные middleware
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

/**
 * Swagger UI — документация API.
 * Доступна без аутентификации по пути /api-docs.
 * Validates: Requirement 11.1
 */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * Корневой роутер — все маршруты API.
 * Validates: Requirements 9.3, 10.1, 10.5
 */
app.use('/api', rootRouter);

/**
 * Глобальный обработчик ошибок.
 * Должен быть зарегистрирован последним.
 * Validates: Requirements 10.1, 10.5
 */
app.use(errorHandler);

module.exports = app;
