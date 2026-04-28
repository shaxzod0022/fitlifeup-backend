# Design Document: fitness-tracker-api

## Overview

REST API для отслеживания фитнеса, питания и сна. Система реализована на **Node.js + Express.js** с использованием **SQLite** в качестве базы данных и **Sequelize ORM** для работы с ней. API предоставляет полный набор эндпоинтов для управления упражнениями, сетами, программами, дневником питания, дневником сна и профилем пользователя.

### Ключевые характеристики

- **Production-ready**: единообразная обработка ошибок, валидация входных данных, логирование
- **Документация**: Swagger UI (OpenAPI 3.0) по пути `/api-docs`
- **Аутентификация**: заглушка через заголовок `X-User-Id` (готова к замене на реальную JWT-систему)
- **Тестирование**: unit-тесты с Jest + Supertest
- **Расширяемость**: placeholder-инфраструктура для AI-рекомендаций
- **Язык документации и комментариев**: русский

### Технологический стек

| Компонент | Технология |
|---|---|
| Runtime | Node.js 18+ |
| Фреймворк | Express.js 4.x |
| ORM | Sequelize 6.x |
| База данных | SQLite 3 |
| Валидация | express-validator |
| Документация | swagger-jsdoc + swagger-ui-express |
| Тестирование | Jest + Supertest |
| Логирование | winston |

---

## Architecture

### Слоистая архитектура

Система следует строгой слоистой архитектуре: каждый слой взаимодействует только со следующим.

```
HTTP Request
     │
     ▼
┌─────────────────────────────────────────┐
│              Middleware                  │
│  (auth, validation, error handling)     │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│               Routes                    │
│  (маршрутизация, Swagger-аннотации)     │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│             Controllers                  │
│  (разбор запроса, формирование ответа)  │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│              Services                   │
│  (бизнес-логика, вычисления)            │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│               Models                    │
│  (Sequelize ORM, SQLite)                │
└─────────────────────────────────────────┘
```

### Структура директорий

```
src/
├── config/
│   ├── database.js          # Конфигурация Sequelize + SQLite
│   └── swagger.js           # Конфигурация swagger-jsdoc
├── middleware/
│   ├── auth.js              # Заглушка аутентификации (X-User-Id)
│   ├── validate.js          # Обёртка express-validator
│   └── errorHandler.js      # Глобальный обработчик ошибок
├── models/
│   ├── index.js             # Инициализация Sequelize, ассоциации
│   ├── Zanyatie.js
│   ├── Set.js
│   ├── SetItem.js           # Элемент сета (связь Set ↔ Zanyatie)
│   ├── Programma.js
│   ├── ProgrammaSet.js      # Элемент программы (связь Programma ↔ Set)
│   ├── Blyudo.js
│   ├── MealLog.js
│   ├── MealEntry.js
│   ├── SleepLog.js
│   ├── UserProfile.js
│   ├── CompletedSet.js
│   └── CompletedProgramma.js
├── routes/
│   ├── index.js             # Корневой роутер
│   ├── auth.routes.js
│   ├── zanyatiya.routes.js
│   ├── sets.routes.js
│   ├── programmy.routes.js
│   ├── blyuda.routes.js
│   ├── mealLogs.routes.js
│   ├── sleepLogs.routes.js
│   ├── userProfile.routes.js
│   ├── progress.routes.js
│   ├── recommendations.routes.js
│   └── health.routes.js
├── controllers/
│   ├── auth.controller.js
│   ├── zanyatiya.controller.js
│   ├── sets.controller.js
│   ├── programmy.controller.js
│   ├── blyuda.controller.js
│   ├── mealLogs.controller.js
│   ├── sleepLogs.controller.js
│   ├── userProfile.controller.js
│   ├── progress.controller.js
│   └── recommendations.controller.js
├── services/
│   ├── zanyatiya.service.js
│   ├── sets.service.js
│   ├── programmy.service.js
│   ├── blyuda.service.js
│   ├── mealLogs.service.js
│   ├── sleepLogs.service.js
│   ├── userProfile.service.js
│   ├── progress.service.js
│   └── recommendations.service.js  # Placeholder AI-рекомендаций
├── validators/
│   ├── zanyatie.validators.js
│   ├── set.validators.js
│   ├── programma.validators.js
│   ├── blyudo.validators.js
│   ├── mealLog.validators.js
│   ├── sleepLog.validators.js
│   └── userProfile.validators.js
├── utils/
│   ├── errors.js            # Классы кастомных ошибок
│   └── logger.js            # Конфигурация winston
└── app.js                   # Инициализация Express-приложения
tests/
├── unit/
│   ├── services/
│   └── utils/
└── integration/
    └── routes/
```

### Поток обработки запроса

```
1. Express получает HTTP-запрос
2. Глобальные middleware (morgan, json-parser, cors)
3. Auth middleware: извлекает X-User-Id → req.userId
   └── Если заголовок отсутствует → 401
4. Route handler → Controller
5. Controller вызывает validators (express-validator)
   └── Если невалидно → 400
6. Controller вызывает Service
7. Service выполняет бизнес-логику, обращается к Models
   └── Если ресурс не найден → 404
   └── Если нет прав → 403
   └── Если конфликт → 409
8. Controller формирует ответ и отправляет клиенту
9. При ошибке → errorHandler middleware → стандартный JSON-ответ
```

---

## Components and Interfaces

### Middleware

#### `auth.js` — Аутентификация

```javascript
/**
 * Middleware аутентификации.
 * Извлекает userId из заголовка X-User-Id.
 * Возвращает 401, если заголовок отсутствует.
 */
function authMiddleware(req, res, next)
```

#### `validate.js` — Валидация

```javascript
/**
 * Запускает цепочку валидаторов express-validator.
 * При наличии ошибок возвращает 400 с массивом нарушений.
 * @param {ValidationChain[]} validations - массив правил валидации
 */
function validate(validations)
```

#### `errorHandler.js` — Обработка ошибок

```javascript
/**
 * Глобальный обработчик ошибок Express.
 * Преобразует любую ошибку в стандартный JSON-формат:
 * { error: { code, message, details } }
 */
function errorHandler(err, req, res, next)
```

### Services (бизнес-логика)

Каждый сервис содержит методы CRUD и специфическую бизнес-логику:

#### `sets.service.js`

```javascript
/**
 * Вычисляет __total_time__ для сета.
 * Формула: sum((zanyatie.time × count × repeats) + (count × break × repeats))
 * @param {SetItem[]} items - элементы сета с вложенными данными Zanyatie
 * @returns {number} суммарное время в минутах
 */
function calculateTotalTime(items)

/**
 * Создаёт новый сет с вычисленным __total_time__.
 * Проверяет доступность всех Zanyatiya для данного пользователя.
 */
async function createSet(userId, data)

/**
 * Обновляет сет, пересчитывает __total_time__.
 * Проверяет права владельца (403 если не владелец).
 */
async function updateSet(userId, setId, data)
```

#### `programmy.service.js`

```javascript
/**
 * Вычисляет __total_time__ программы как сумму __total_time__ всех сетов.
 * @param {Set[]} sets - сеты с вычисленным __total_time__
 * @returns {number} суммарное время в минутах
 */
function calculateProgrammaTotalTime(sets)
```

#### `mealLogs.service.js`

```javascript
/**
 * Создаёт MealEntry с опциональным snapshot.
 * При useSnapshot=true копирует данные Blyudo в поле snapshot.
 */
async function addMealEntry(mealLogId, data)

/**
 * Возвращает сводку питания за дату:
 * суммарные protein, carbohydrate, fat.
 */
async function getNutritionSummary(userId, date)
```

#### `sleepLogs.service.js`

```javascript
/**
 * Возвращает статистику сна за период:
 * средняя продолжительность, средняя оценка, среднее число пробуждений.
 */
async function getSleepStats(userId, startDate, endDate)
```

#### `progress.service.js`

```javascript
/**
 * Возвращает статистику прогресса пользователя:
 * - общее количество завершённых Sets
 * - общее количество завершённых Programm
 * - тренировочные дни за 7 и 30 дней
 */
async function getProgressStats(userId)
```

#### `recommendations.service.js` (Placeholder)

```javascript
/**
 * Заглушка сервиса AI-рекомендаций.
 * Интерфейс зафиксирован для будущей реализации без изменения контракта.
 */

/**
 * Возвращает рекомендации по тренировкам для пользователя.
 * TODO: реализовать с использованием AI-модуля.
 * @param {string} userId
 * @returns {Promise<object>} объект с рекомендациями
 */
async function getWorkoutRecommendations(userId)

/**
 * Возвращает рекомендации по питанию для пользователя.
 * TODO: реализовать с использованием AI-модуля.
 * @param {string} userId
 * @returns {Promise<object>} объект с рекомендациями
 */
async function getNutritionRecommendations(userId)

/**
 * Возвращает рекомендации по сну для пользователя.
 * TODO: реализовать с использованием AI-модуля.
 * @param {string} userId
 * @returns {Promise<object>} объект с рекомендациями
 */
async function getSleepRecommendations(userId)
```

### Утилиты

#### `utils/errors.js` — Кастомные классы ошибок

```javascript
class AppError extends Error          // Базовый класс
class ValidationError extends AppError  // 400
class UnauthorizedError extends AppError // 401
class ForbiddenError extends AppError    // 403
class NotFoundError extends AppError     // 404
class ConflictError extends AppError     // 409
class UnprocessableError extends AppError // 422
```

### API Endpoints

| Метод | Путь | Описание |
|---|---|---|
| GET | /health | Статус сервиса |
| POST | /auth/register | Заглушка регистрации |
| POST | /auth/login | Заглушка входа |
| GET/POST | /zanyatiya | Список / создание упражнений |
| GET/PUT/DELETE | /zanyatiya/:id | Получение / обновление / удаление |
| GET/POST | /sets | Список / создание сетов |
| GET/PUT/DELETE | /sets/:id | Получение / обновление / удаление |
| GET/POST | /programmy | Список / создание программ |
| GET/PUT/DELETE | /programmy/:id | Получение / обновление / удаление |
| GET/POST | /blyuda | Список / создание блюд |
| GET/PUT/DELETE | /blyuda/:id | Получение / обновление / удаление |
| GET/POST | /meal-logs | Список / создание записей питания |
| GET | /meal-logs/:id | Получение записи питания |
| POST | /meal-logs/:id/entries | Добавление позиции в лог |
| GET | /meal-logs/summary | Сводка питания за дату |
| GET/POST | /sleep-logs | Список / создание записей сна |
| GET/PUT/DELETE | /sleep-logs/:id | Получение / обновление / удаление |
| GET | /sleep-logs/stats | Статистика сна за период |
| GET/PUT | /profile | Получение / обновление профиля |
| POST | /profile | Создание профиля |
| POST | /progress/sets/:setId/complete | Отметить сет завершённым |
| POST | /progress/programmy/:programmaId/complete | Отметить программу завершённой |
| GET | /progress/stats | Статистика прогресса |
| GET | /progress/history | История завершений |
| GET | /recommendations | Placeholder рекомендаций |
| GET | /api-docs | Swagger UI |

---

## Data Models

### Диаграмма сущностей

```
UserProfile ──── userId (1:1)
CompletedSet ─── userId, setId
CompletedProgramma ── userId, programmaId

Zanyatie ──────────────────────────────────────────────────────────────────────
  id, name, subtitle, tags[], description, image, time, visibility, creatorId

SetItem ──── setId (FK) ──── zanyatieId (FK)
  id, setId, zanyatieId, count, break, repeats, order

Set ────────────────────────────────────────────────────────────────────────────
  id, name, tags[], level, visibility, creatorId, __total_time__
  └── hasMany SetItem

ProgrammaSet ── programmaId (FK) ── setId (FK)
  id, programmaId, setId, order

Programma ──────────────────────────────────────────────────────────────────────
  id, name, image, subtitle, tags[], level, visibility, creatorId, __total_time__
  └── hasMany ProgrammaSet

Blyudo ─────────────────────────────────────────────────────────────────────────
  id, name, description, image, visibility, tags[], creatorId,
  protein, carbohydrate, fat

MealEntry ── mealLogId (FK) ── blyudoId (FK, nullable)
  id, mealLogId, blyudoId, snapshot (JSON), useSnapshot, portionGrams

MealLog ────────────────────────────────────────────────────────────────────────
  id, userId, date, mealType, customMealName
  └── hasMany MealEntry
  └── unique(userId, date, mealType)

SleepLog ───────────────────────────────────────────────────────────────────────
  id, userId, sleepAt, wakeAt, qualityScore, awakenings
```

### Sequelize-модели (ключевые поля)

#### `Zanyatie`

```javascript
{
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:        { type: DataTypes.STRING, allowNull: false },
  subtitle:    { type: DataTypes.STRING },
  tags:        { type: DataTypes.JSON, defaultValue: [] },
  description: { type: DataTypes.TEXT },
  image:       { type: DataTypes.STRING },
  time:        { type: DataTypes.FLOAT },           // длительность в минутах
  visibility:  { type: DataTypes.ENUM('public', 'private'), defaultValue: 'private' },
  creatorId:   { type: DataTypes.STRING, allowNull: false },
}
```

#### `Set`

```javascript
{
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:          { type: DataTypes.STRING, allowNull: false },
  tags:          { type: DataTypes.JSON, defaultValue: [] },
  level:         { type: DataTypes.STRING },
  visibility:    { type: DataTypes.ENUM('public', 'private'), defaultValue: 'private' },
  creatorId:     { type: DataTypes.STRING, allowNull: false },
  __total_time__: { type: DataTypes.FLOAT, defaultValue: 0 },
}
// Ассоциации:
// Set.hasMany(SetItem, { foreignKey: 'setId', as: 'items' })
// SetItem.belongsTo(Zanyatie, { foreignKey: 'zanyatieId', as: 'zanyatie' })
```

#### `SetItem`

```javascript
{
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  setId:      { type: DataTypes.UUID, allowNull: false },
  zanyatieId: { type: DataTypes.UUID, allowNull: false },
  count:      { type: DataTypes.INTEGER, defaultValue: 1 },   // повторений в цикле
  break:      { type: DataTypes.INTEGER, defaultValue: 0 },   // пауза в секундах
  repeats:    { type: DataTypes.INTEGER, defaultValue: 1 },   // количество циклов
  order:      { type: DataTypes.INTEGER, defaultValue: 0 },
}
```

#### `Programma`

```javascript
{
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:          { type: DataTypes.STRING, allowNull: false },
  image:         { type: DataTypes.STRING },
  subtitle:      { type: DataTypes.STRING },
  tags:          { type: DataTypes.JSON, defaultValue: [] },
  level:         { type: DataTypes.STRING },
  visibility:    { type: DataTypes.ENUM('public', 'private'), defaultValue: 'private' },
  creatorId:     { type: DataTypes.STRING, allowNull: false },
  __total_time__: { type: DataTypes.FLOAT, defaultValue: 0 },
}
```

#### `Blyudo`

```javascript
{
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:         { type: DataTypes.STRING, allowNull: false },
  description:  { type: DataTypes.TEXT },
  image:        { type: DataTypes.STRING },
  visibility:   { type: DataTypes.ENUM('public', 'private'), defaultValue: 'private' },
  tags:         { type: DataTypes.JSON, defaultValue: [] },
  creatorId:    { type: DataTypes.STRING, allowNull: false },
  protein:      { type: DataTypes.FLOAT },
  carbohydrate: { type: DataTypes.FLOAT },
  fat:          { type: DataTypes.FLOAT },
}
```

#### `MealLog`

```javascript
{
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:         { type: DataTypes.STRING, allowNull: false },
  date:           { type: DataTypes.DATEONLY, allowNull: false },
  mealType:       { type: DataTypes.ENUM('breakfast','lunch','dinner','afternoon_snack','evening_snack','custom'), allowNull: false },
  customMealName: { type: DataTypes.STRING },
}
// Уникальный индекс: (userId, date, mealType)
```

#### `MealEntry`

```javascript
{
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  mealLogId:    { type: DataTypes.UUID, allowNull: false },
  blyudoId:     { type: DataTypes.UUID },                    // nullable
  snapshot:     { type: DataTypes.JSON },                    // nullable
  useSnapshot:  { type: DataTypes.BOOLEAN, defaultValue: false },
  portionGrams: { type: DataTypes.FLOAT },
}
```

#### `SleepLog`

```javascript
{
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:       { type: DataTypes.STRING, allowNull: false },
  sleepAt:      { type: DataTypes.DATE, allowNull: false },
  wakeAt:       { type: DataTypes.DATE, allowNull: false },
  qualityScore: { type: DataTypes.INTEGER },   // 1–5
  awakenings:   { type: DataTypes.INTEGER },
}
```

#### `UserProfile`

```javascript
{
  id:               { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:           { type: DataTypes.STRING, allowNull: false, unique: true },
  name:             { type: DataTypes.STRING },
  phone:            { type: DataTypes.STRING },
  gender:           { type: DataTypes.STRING },
  age:              { type: DataTypes.INTEGER },
  height:           { type: DataTypes.FLOAT },
  weight:           { type: DataTypes.FLOAT },
  fitnessGoal:      { type: DataTypes.ENUM('weight_loss','muscle_gain','weight_maintenance','rehabilitation') },
  workoutFrequency: { type: DataTypes.ENUM('low','medium','high') },
}
```

#### `CompletedSet` / `CompletedProgramma`

```javascript
// CompletedSet
{
  id:              { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:          { type: DataTypes.STRING, allowNull: false },
  setId:           { type: DataTypes.UUID, allowNull: false },
  completedAt:     { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  durationMinutes: { type: DataTypes.FLOAT },
}

// CompletedProgramma
{
  id:              { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:          { type: DataTypes.STRING, allowNull: false },
  programmaId:     { type: DataTypes.UUID, allowNull: false },
  completedAt:     { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  durationMinutes: { type: DataTypes.FLOAT },
}
```

### Формат ошибок

Все ошибки возвращаются в едином формате:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Ошибка валидации входных данных",
    "details": [
      { "field": "name", "message": "Поле name обязательно" }
    ]
  }
}
```

