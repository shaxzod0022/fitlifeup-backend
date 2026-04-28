'use strict';

const swaggerJsdoc = require('swagger-jsdoc');

/**
 * Конфигурация swagger-jsdoc для генерации OpenAPI 3.0 документации.
 * Validates: Requirements 11.1, 11.4
 */
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fitness Tracker API',
      version: '1.0.0',
      description:
        'REST API для отслеживания фитнеса, питания и сна. ' +
        'Для доступа к защищённым эндпоинтам используйте JWT токены (Bearer authentication).',
    },
    servers: [
      {
        url: '/api',
        description: 'API сервер',
      },
    ],
    components: {
      securitySchemes: {
        /**
         * JWT Bearer token authentication.
         * Required for all protected endpoints.
         */
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'JWT access token obtained from /auth/login or /auth/refresh. ' +
            'Include in Authorization header as: Bearer {token}',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'NOT_FOUND' },
                message: { type: 'string', example: 'Ресурс не найден' },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: { type: 'string' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        Exercise: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Приседания' },
            subtitle: { type: 'string', example: 'Базовое упражнение' },
            tags: { type: 'array', items: { type: 'string' }, example: ['ноги', 'базовое'] },
            description: { type: 'string' },
            image: { type: 'string', format: 'uri' },
            time: { type: 'number', example: 1.5 },
            visibility: { type: 'string', enum: ['public', 'private'], example: 'private' },
            creatorId: { type: 'string', example: 'user-123' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ExerciseInput: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Приседания' },
            subtitle: { type: 'string', example: 'Базовое упражнение' },
            tags: { type: 'array', items: { type: 'string' }, example: ['ноги'] },
            description: { type: 'string' },
            image: { type: 'string', format: 'uri' },
            time: { type: 'number', example: 1.5 },
            visibility: { type: 'string', enum: ['public', 'private'], example: 'private' },
          },
        },
        Set: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Утренняя тренировка' },
            tags: { type: 'array', items: { type: 'string' } },
            level: { type: 'string', example: 'beginner' },
            visibility: { type: 'string', enum: ['public', 'private'] },
            creatorId: { type: 'string' },
            __total_time__: { type: 'number', example: 45.0 },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/SetItem' },
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        SetItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            exerciseId: { type: 'string', format: 'uuid' },
            count: { type: 'integer', example: 3 },
            break: { type: 'integer', example: 60 },
            repeats: { type: 'integer', example: 2 },
            order: { type: 'integer', example: 1 },
          },
        },
        Program: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Программа для похудения' },
            image: { type: 'string', format: 'uri' },
            subtitle: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            level: { type: 'string' },
            visibility: { type: 'string', enum: ['public', 'private'] },
            creatorId: { type: 'string' },
            __total_time__: { type: 'number', example: 120.0 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Dish: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Овсяная каша' },
            description: { type: 'string' },
            image: { type: 'string', format: 'uri' },
            visibility: { type: 'string', enum: ['public', 'private'] },
            tags: { type: 'array', items: { type: 'string' } },
            creatorId: { type: 'string' },
            protein: { type: 'number', nullable: true, example: 5.5 },
            carbohydrate: { type: 'number', nullable: true, example: 30.0 },
            fat: { type: 'number', nullable: true, example: 3.2 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        MealLog: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string' },
            date: { type: 'string', format: 'date', example: '2024-01-15' },
            mealType: {
              type: 'string',
              enum: ['breakfast', 'lunch', 'dinner', 'afternoon_snack', 'evening_snack', 'custom'],
            },
            customMealName: { type: 'string', nullable: true },
            entries: { type: 'array', items: { $ref: '#/components/schemas/MealEntry' } },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        MealEntry: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            mealLogId: { type: 'string', format: 'uuid' },
            dishId: { type: 'string', format: 'uuid', nullable: true },
            snapshot: { type: 'object', nullable: true },
            useSnapshot: { type: 'boolean', example: false },
            portionGrams: { type: 'number', nullable: true, example: 200 },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        SleepLog: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string' },
            sleepAt: { type: 'string', format: 'date-time', example: '2024-01-15T22:30:00Z' },
            wakeAt: { type: 'string', format: 'date-time', example: '2024-01-16T06:30:00Z' },
            qualityScore: { type: 'integer', minimum: 1, maximum: 5, nullable: true, example: 4 },
            awakenings: { type: 'integer', nullable: true, example: 1 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        UserProfile: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string' },
            name: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            gender: { type: 'string', nullable: true },
            age: { type: 'integer', nullable: true },
            height: { type: 'number', nullable: true },
            weight: { type: 'number', nullable: true },
            fitnessGoal: {
              type: 'string',
              enum: ['weight_loss', 'muscle_gain', 'weight_maintenance', 'rehabilitation'],
              nullable: true,
            },
            workoutFrequency: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              nullable: true,
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Missing or invalid authentication token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: {
                  code: 'UNAUTHORIZED',
                  message: 'Authentication required: No token provided',
                },
              },
            },
          },
        },
        Forbidden: {
          description: 'Нет прав доступа к ресурсу',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: {
                  code: 'FORBIDDEN',
                  message: 'Нет прав для выполнения этого действия',
                },
              },
            },
          },
        },
        NotFound: {
          description: 'Ресурс не найден',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: {
                  code: 'NOT_FOUND',
                  message: 'Ресурс не найден',
                },
              },
            },
          },
        },
        ValidationError: {
          description: 'Ошибка валидации входных данных',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: {
                  code: 'VALIDATION_ERROR',
                  message: 'Ошибка валидации входных данных',
                  details: [{ field: 'name', message: 'Поле name обязательно' }],
                },
              },
            },
          },
        },
        Conflict: {
          description: 'Конфликт уникальности',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: {
                  code: 'CONFLICT',
                  message: 'Ресурс уже существует',
                },
              },
            },
          },
        },
      },
    },
    security: [],
  },
  // Сканировать все файлы маршрутов для JSDoc-аннотаций
  apis: ['src/routes/**/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
