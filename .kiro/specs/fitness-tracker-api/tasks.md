# Implementation Plan: fitness-tracker-api

## Overview

Реализация REST API для отслеживания фитнеса, питания и сна на Node.js + Express.js + Sequelize + SQLite.
Задачи выстроены инкрементально: каждый шаг опирается на предыдущий и завершается интеграцией компонентов.

> **Примечание по именованию:** В кодовой базе используются английские имена моделей (`Exercise`, `WorkoutSet`, `WorkoutProgram`, `Dish`) вместо русских из дизайна (`Zanyatie`, `Set`, `Programma`, `Blyudo`). Это намеренное решение, принятое в ходе реализации.

## Implementation Status

✅ **Core implementation complete** — All main features have been implemented and are functional.

🧪 **Testing status** — Unit tests exist for all services and middleware. Integration tests cover exercises and core routes. Additional integration test coverage can be added as optional enhancements.

## Tasks

- [x] 1. Инициализация проекта и базовая инфраструктура
  - Создать `package.json` с зависимостями: express, sequelize, sqlite3, express-validator, swagger-jsdoc, swagger-ui-express, winston, jest, supertest
  - Создать структуру директорий согласно дизайну: `src/config`, `src/middleware`, `src/models`, `src/routes`, `src/controllers`, `src/services`, `src/validators`, `src/utils`, `tests/unit`, `tests/integration`
  - Создать `src/app.js` с инициализацией Express, подключением глобальных middleware (json-parser, cors, morgan)
  - Создать точку входа `src/index.js` для запуска сервера
  - _Requirements: 9, 10_

- [x] 2. Конфигурация базы данных и утилиты
  - [x] 2.1 Создать `src/config/database.js` — инициализация Sequelize с SQLite
    - Настроить подключение к SQLite-файлу, экспортировать экземпляр sequelize
    - _Requirements: 1.1, 2.1, 3.1_

  - [x] 2.2 Создать `src/utils/errors.js` — кастомные классы ошибок
    - Реализовать `AppError`, `ValidationError` (400), `UnauthorizedError` (401), `ForbiddenError` (403), `NotFoundError` (404), `ConflictError` (409), `UnprocessableError` (422)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 2.3 Создать `src/utils/logger.js` — конфигурация Winston
    - Настроить логирование в консоль и файл; уровень error для 500-ошибок
    - _Requirements: 10.6_

  - [x] 2.4 Написать unit-тесты для кастомных классов ошибок
    - Проверить корректность кодов статусов и форматов сообщений
    - _Requirements: 10.1_

- [x] 3. Middleware: аутентификация, валидация, обработка ошибок
  - [x] 3.1 Создать `src/middleware/auth.js` — auth stub
    - Извлекать `userId` из заголовка `X-User-Id`, прикреплять к `req.userId`
    - Возвращать 401, если заголовок отсутствует
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 3.2 Создать `src/middleware/validate.js` — обёртка express-validator
    - Запускать цепочку валидаторов; при ошибках возвращать 400 с массивом нарушений
    - _Requirements: 10.2_

  - [x] 3.3 Создать `src/middleware/errorHandler.js` — глобальный обработчик ошибок
    - Преобразовывать любую ошибку в формат `{ error: { code, message, details } }`
    - Логировать 500-ошибки с полным стек-трейсом через winston
    - _Requirements: 10.1, 10.5, 10.6_

  - [x] 3.4 Написать unit-тесты для auth middleware
    - Тест: заголовок присутствует → `req.userId` установлен, вызван `next()`
    - Тест: заголовок отсутствует → ответ 401
    - Файл: `tests/unit/middleware/auth.test.js`
    - _Requirements: 9.1, 9.2_

  - [x] 3.5 Написать unit-тесты для errorHandler middleware
    - Тест: AppError → корректный статус и формат JSON
    - Тест: неизвестная ошибка → статус 500, детали не раскрываются
    - Файл: `tests/unit/middleware/errorHandler.test.js`
    - _Requirements: 10.1, 10.5_

  - [x] 3.6 Написать unit-тесты для validate middleware
    - Тест: валидные данные → вызван `next()` без аргументов
    - Тест: невалидные данные → статус 400 с массивом ошибок
    - Файл: `tests/unit/middleware/validate.test.js`
    - _Requirements: 10.2_

- [x] 4. Checkpoint — базовая инфраструктура
  - Убедиться, что сервер запускается, middleware подключены, тесты проходят. Задать вопросы пользователю при необходимости.

- [x] 5. Sequelize-модели
  - [x] 5.1 Создать модели упражнений и сетов: `src/models/Exercise.js`, `src/models/Set.js`, `src/models/SetItem.js`
    - Определить поля согласно дизайну; настроить ассоциации `WorkoutSet.hasMany(SetItem)`, `SetItem.belongsTo(Exercise)`
    - _Requirements: 1.1, 2.1_

  - [x] 5.2 Создать модели программ: `src/models/Program.js`, `src/models/ProgramSet.js`
    - Определить поля; настроить ассоциации `WorkoutProgram.hasMany(ProgramSet)`, `ProgramSet.belongsTo(WorkoutSet)`
    - _Requirements: 3.1_

  - [x] 5.3 Создать модели питания: `src/models/Dish.js`, `src/models/MealLog.js`, `src/models/MealEntry.js`
    - Определить поля; уникальный индекс `(userId, date, mealType)` для MealLog; ассоциации `MealLog.hasMany(MealEntry)`, `MealEntry.belongsTo(Dish)`
    - _Requirements: 5.1, 6.2, 6.3_

  - [x] 5.4 Создать модели сна, профиля и прогресса: `src/models/SleepLog.js`, `src/models/UserProfile.js`, `src/models/CompletedSet.js`, `src/models/CompletedProgram.js`
    - Определить поля; уникальный индекс `userId` для UserProfile
    - _Requirements: 7.1, 8.1, 4.1, 4.2_

  - [x] 5.5 Создать `src/models/index.js` — инициализация Sequelize и регистрация всех моделей
    - Импортировать все модели, вызвать `sequelize.sync()`, экспортировать модели
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.2, 7.1, 8.1_

- [x] 6. Модуль упражнений (Exercises)
  - [x] 6.1 Создать `src/validators/exercise.validators.js`
    - Правила: `name` обязательно; `visibility` — enum `public`/`private`
    - _Requirements: 1.9_

  - [x] 6.2 Создать `src/services/exercises.service.js`
    - `createExercise(userId, data)` — сохранить с `creatorId = userId`, вернуть объект
    - `listExercises(userId)` — вернуть public + собственные упражнения пользователя
    - `getExerciseById(userId, id)` — проверить видимость и права (403 если private чужое)
    - `updateExercise(userId, id, data)` — проверить владельца (403 если не владелец)
    - `deleteExercise(userId, id)` — проверить владельца, удалить
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.10_

  - [x] 6.3 Создать `src/controllers/exercises.controller.js` и `src/routes/exercises.routes.js`
    - Маршруты: `GET/POST /exercises`, `GET/PUT/DELETE /exercises/:id`
    - Подключить auth middleware и validators
    - _Requirements: 1.2, 1.3, 1.4, 1.6, 1.8_

  - [x] 6.4 Написать unit-тесты для `exercises.service.js`
    - Тест: создание → `creatorId` установлен, статус 201
    - Тест: получение чужого private → 403
    - Тест: обновление/удаление чужого → 403
    - Файл: `tests/unit/services/exercises.service.test.js`
    - _Requirements: 1.2, 1.5, 1.7_

  - [x] 6.5 Написать интеграционные тесты для маршрутов `/exercises`
    - Тест: CRUD-операции с корректным `X-User-Id`
    - Тест: запрос без заголовка → 401
    - Тест: создание без `name` → 400
    - _Requirements: 1.9, 9.2_

- [x] 7. Модуль сетов (Sets)
  - [x] 7.1 Создать `src/validators/set.validators.js`
    - Правила: `name` обязательно; элементы массива содержат `exerciseId`, `count`, `break`, `repeats`
    - _Requirements: 2.9_

  - [x] 7.2 Создать `src/services/sets.service.js`
    - `calculateTotalTime(items)` — формула: `sum((exercise.time × count × repeats) + (count × break × repeats))`
    - `createSet(userId, data)` — проверить доступность упражнений (422 если private чужое), вычислить `__total_time__`, сохранить
    - `listSets(userId)` — вернуть public + собственные сеты
    - `updateSet(userId, id, data)` — проверить владельца (403), пересчитать `__total_time__`
    - `deleteSet(userId, id)` — проверить владельца, удалить
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [x] 7.3 Создать `src/controllers/sets.controller.js` и `src/routes/sets.routes.js`
    - Маршруты: `GET/POST /sets`, `GET/PUT/DELETE /sets/:id`
    - _Requirements: 2.3, 2.4, 2.6, 2.8_

  - [x] 7.4 Написать unit-тесты для `calculateTotalTime`
    - Тест: корректный расчёт для одного элемента
    - Тест: корректный расчёт для нескольких элементов
    - Тест: нулевые значения → 0
    - _Requirements: 2.2_

  - [x] 7.5 Написать unit-тесты для `sets.service.js`
    - Тест: создание с private чужим упражнением → 422
    - Тест: обновление/удаление чужого сета → 403
    - _Requirements: 2.5, 2.7_

- [x] 8. Модуль программ (Programs)
  - [x] 8.1 Создать `src/services/programs.service.js`
    - `calculateProgramTotalTime(sets)` — сумма `__total_time__` всех сетов
    - `createProgram(userId, data)` — проверить доступность сетов (422 если private чужой), вычислить `__total_time__`, сохранить
    - `listPrograms(userId)` — вернуть public + собственные программы
    - `updateProgram(userId, id, data)` — проверить владельца (403), пересчитать `__total_time__`
    - `deleteProgram(userId, id)` — проверить владельца, удалить
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x] 8.2 Создать `src/controllers/programs.controller.js` и `src/routes/programs.routes.js`
    - Маршруты: `GET/POST /programs`, `GET/PUT/DELETE /programs/:id`
    - _Requirements: 3.3, 3.4, 3.6, 3.8_

  - [x] 8.3 Написать unit-тесты для `programs.service.js`
    - Тест: `calculateProgramTotalTime` — корректная сумма
    - Тест: создание с private чужим сетом → 422
    - Тест: обновление/удаление чужой программы → 403
    - _Requirements: 3.2, 3.5, 3.7_

- [x] 9. Checkpoint — модули тренировок
  - Убедиться, что все тесты для exercises, sets, programs проходят. Задать вопросы пользователю при необходимости.

- [x] 10. Модуль блюд (Dishes)
  - [x] 10.1 Создать `src/validators/dish.validators.js`
    - Правила: `name` обязательно; `visibility` — enum; `protein`, `carbohydrate`, `fat` — числа или null
    - _Requirements: 5.7_

  - [x] 10.2 Создать `src/services/dishes.service.js`
    - `createDish(userId, data)` — сохранить с `creatorId = userId`
    - `listDishes(userId)` — вернуть public + собственные блюда
    - `updateDish(userId, id, data)` — проверить владельца (403)
    - `deleteDish(userId, id)` — проверить владельца, удалить
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 10.3 Создать `src/controllers/dishes.controller.js` и `src/routes/dishes.routes.js`
    - Маршруты: `GET/POST /dishes`, `GET/PUT/DELETE /dishes/:id`
    - _Requirements: 5.2, 5.3, 5.4, 5.6_

  - [x] 10.4 Написать unit-тесты для `dishes.service.js`
    - Тест: создание → `creatorId` установлен
    - Тест: обновление/удаление чужого → 403
    - _Requirements: 5.2, 5.5_

- [x] 11. Дневник питания (Meal Logs)
  - [x] 11.1 Создать `src/validators/mealLog.validators.js`
    - Правила: `date` обязательна; `mealType` — enum из 6 значений; `customMealName` обязателен при `mealType = custom`
    - _Requirements: 6.1, 6.2_

  - [x] 11.2 Создать `src/services/mealLogs.service.js`
    - `createMealLog(userId, data)` — проверить уникальность `(userId, date, mealType)` (409 при конфликте)
    - `addMealEntry(mealLogId, data)` — при `useSnapshot = true` скопировать данные Dish в `snapshot`
    - `getMealLogsByDate(userId, date)` — вернуть все MealLog за дату с вложенными MealEntry и данными блюда
    - `getNutritionSummary(userId, date)` — суммировать `protein`, `carbohydrate`, `fat` по всем MealEntry за день
    - _Requirements: 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_

  - [x] 11.3 Создать `src/controllers/mealLogs.controller.js` и `src/routes/mealLogs.routes.js`
    - Маршруты: `GET/POST /meal-logs`, `GET /meal-logs/:id`, `POST /meal-logs/:id/entries`, `GET /meal-logs/summary`
    - _Requirements: 6.6, 6.7, 6.9_

  - [x] 11.4 Написать unit-тесты для `mealLogs.service.js`
    - Тест: создание дублирующего MealLog → 409
    - Тест: `addMealEntry` с `useSnapshot = true` → snapshot заполнен
    - Тест: `addMealEntry` с `useSnapshot = false` → только `dishId`
    - Тест: `getNutritionSummary` → корректная сумма макронутриентов
    - _Requirements: 6.4, 6.5, 6.8, 6.9_

- [x] 12. Дневник сна (Sleep Logs)
  - [x] 12.1 Создать `src/validators/sleepLog.validators.js`
    - Правила: `sleepAt` и `wakeAt` обязательны; `qualityScore` — целое 1–5; `wakeAt` > `sleepAt`
    - _Requirements: 7.3, 7.4_

  - [x] 12.2 Создать `src/services/sleepLogs.service.js`
    - `createSleepLog(userId, data)` — валидировать `wakeAt > sleepAt` (400 если нет)
    - `listSleepLogs(userId, limit, offset)` — только записи пользователя, сортировка по `sleepAt` DESC
    - `updateSleepLog(userId, id, data)` — проверить владельца (403)
    - `deleteSleepLog(userId, id)` — проверить владельца, удалить
    - `getSleepStats(userId, startDate, endDate)` — средняя продолжительность, средняя оценка, среднее число пробуждений
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9_

  - [x] 12.3 Создать `src/controllers/sleepLogs.controller.js` и `src/routes/sleepLogs.routes.js`
    - Маршруты: `GET/POST /sleep-logs`, `GET/PUT/DELETE /sleep-logs/:id`, `GET /sleep-logs/stats`
    - _Requirements: 7.2, 7.5, 7.6, 7.8, 7.9_

  - [x] 12.4 Написать unit-тесты для `sleepLogs.service.js`
    - Тест: `wakeAt` < `sleepAt` → 400
    - Тест: `qualityScore` вне диапазона → 400
    - Тест: обновление/удаление чужой записи → 403
    - Тест: `getSleepStats` → корректные средние значения
    - _Requirements: 7.3, 7.4, 7.7, 7.9_

- [x] 13. Профиль пользователя (UserProfile)
  - [x] 13.1 Создать `src/validators/userProfile.validators.js`
    - Правила: `fitnessGoal` — enum из 4 значений; `workoutFrequency` — enum из 3 значений
    - _Requirements: 8.2, 8.3, 8.7_

  - [x] 13.2 Создать `src/services/userProfile.service.js`
    - `createProfile(userId, data)` — проверить уникальность `userId` (409 если уже существует)
    - `getProfile(userId)` — вернуть профиль пользователя
    - `updateProfile(userId, data)` — применить изменения
    - _Requirements: 8.4, 8.5, 8.6, 8.8_

  - [x] 13.3 Создать `src/controllers/userProfile.controller.js` и `src/routes/userProfile.routes.js`
    - Маршруты: `POST /profile`, `GET/PUT /profile`
    - _Requirements: 8.4, 8.6, 8.8_

  - [x] 13.4 Написать unit-тесты для `userProfile.service.js`
    - Тест: создание дублирующего профиля → 409
    - Тест: недопустимый `fitnessGoal` → 400
    - _Requirements: 8.5, 8.7_

- [x] 14. Checkpoint — модули питания, сна и профиля
  - Убедиться, что все тесты для dishes, meal-logs, sleep-logs, profile проходят. Задать вопросы пользователю при необходимости.

- [x] 15. Модуль прогресса тренировок (Progress)
  - [x] 15.1 Создать `src/services/progress.service.js`
    - `completeSet(userId, setId, data)` — создать запись `CompletedSet`, вернуть со статусом 201
    - `completeProgram(userId, programId, data)` — создать запись `CompletedProgram`, вернуть со статусом 201
    - `getProgressStats(userId)` — вернуть: кол-во завершённых Sets, кол-во завершённых Programs, тренировочные дни за 7 и 30 дней
    - `getCompletionHistory(userId, limit, offset)` — история завершений, сортировка по `completedAt` DESC
    - _Requirements: 4.3, 4.4, 4.5, 4.6_

  - [x] 15.2 Создать `src/controllers/progress.controller.js` и `src/routes/progress.routes.js`
    - Маршруты: `POST /progress/sets/:setId/complete`, `POST /progress/programs/:programId/complete`, `GET /progress/stats`, `GET /progress/history`
    - _Requirements: 4.3, 4.4, 4.5, 4.6_

  - [x] 15.3 Написать unit-тесты для `progress.service.js`
    - Тест: `getProgressStats` → корректный подсчёт тренировочных дней за 7 и 30 дней
    - Тест: `getCompletionHistory` → сортировка по убыванию `completedAt`
    - _Requirements: 4.5, 4.6_

- [x] 16. Auth stub, Health и Recommendations
  - [x] 16.1 Создать `src/controllers/auth.controller.js` и `src/routes/auth.routes.js`
    - `POST /auth/register` — принять `name`, вернуть `{ userId, message }` (заглушка)
    - `POST /auth/login` — вернуть `{ userId, message }` (заглушка)
    - Маршруты не требуют auth middleware
    - _Requirements: 9.4, 9.5_

  - [x] 16.2 Создать `src/routes/health.routes.js`
    - `GET /health` — вернуть 200 с информацией о состоянии сервиса (без auth middleware)
    - _Requirements: 10.7_

  - [x] 16.3 Создать `src/services/recommendations.service.js` и `src/controllers/recommendations.controller.js`
    - Реализовать заглушки: `getWorkoutRecommendations(userId)`, `getNutritionRecommendations(userId)`, `getSleepRecommendations(userId)`
    - `GET /recommendations` — вернуть 200 с сообщением о будущей реализации
    - _Requirements: 12.1, 12.2, 12.3_

- [x] 17. Конфигурация Swagger и документация API
  - [x] 17.1 Создать `src/config/swagger.js` — конфигурация swagger-jsdoc
    - Настроить OpenAPI 3.0; описать схему заголовка `X-User-Id` как обязательного параметра безопасности
    - _Requirements: 11.1, 11.4_

  - [x] 17.2 Добавить JSDoc-аннотации Swagger ко всем маршрутам
    - Описать параметры запроса, тела запросов, схемы ответов, коды статусов и примеры для каждого эндпоинта
    - _Requirements: 11.2, 11.3_

  - [x] 17.3 Подключить `swagger-ui-express` в `src/app.js` по пути `/api-docs` (без auth middleware)
    - _Requirements: 11.1_

- [x] 18. Сборка корневого роутера и финальная интеграция
  - [x] 18.1 Создать `src/routes/index.js` — корневой роутер
    - Подключить все маршруты; применить auth middleware ко всем, кроме `/health`, `/api-docs`, `/auth/*`
    - _Requirements: 9.3_

  - [x] 18.2 Обновить `src/app.js` — подключить корневой роутер и errorHandler
    - Зарегистрировать `errorHandler` как последний middleware
    - _Requirements: 10.1, 10.5_

  - [x] 18.3 Написать интеграционные тесты для ключевых маршрутов
    - Тест: `GET /health` → 200 без заголовка
    - Тест: `GET /api-docs` → 200 без заголовка
    - Тест: любой защищённый маршрут без `X-User-Id` → 401
    - Тест: ошибка 500 → формат `{ error: { code, message } }`, детали не раскрываются
    - _Requirements: 9.2, 9.3, 10.1, 10.5, 10.7_

- [x] 19. Финальный checkpoint — полная интеграция
  - Убедиться, что все тесты проходят, сервер запускается, Swagger UI доступен по `/api-docs`. Задать вопросы пользователю при необходимости.

## Notes

- Все основные задачи реализации завершены ✅
- Каждая задача ссылается на конкретные требования для обеспечения трассируемости
- Checkpoint-задачи обеспечивают инкрементальную валидацию на каждом этапе
- Модели используют английские имена (`Exercise`, `WorkoutSet`, `WorkoutProgram`, `Dish`) вместо русских из дизайна

### Текущее тестовое покрытие

| Компонент | Unit-тесты | Интеграционные тесты |
|---|---|---|
| `middleware/auth` | ✅ реализованы | — |
| `middleware/errorHandler` | ✅ реализованы | — |
| `middleware/validate` | ✅ реализованы | — |
| `utils/errors` | ✅ реализованы | — |
| `services/exercises` | ✅ реализованы | ✅ реализованы |
| `services/sets` | ✅ реализованы | 🔶 частично |
| `services/programs` | ✅ реализованы | 🔶 частично |
| `services/dishes` | ✅ реализованы | 🔶 частично |
| `services/mealLogs` | ✅ реализованы | 🔶 частично |
| `services/sleepLogs` | ✅ реализованы | 🔶 частично |
| `services/userProfile` | ✅ реализованы | 🔶 частично |
| `services/progress` | ✅ реализованы | 🔶 частично |
| Ключевые маршруты | — | ✅ реализованы |

**Легенда:**
- ✅ реализованы — тесты существуют и покрывают основные сценарии
- 🔶 частично — базовые тесты через общие маршруты существуют, специфичные интеграционные тесты можно добавить
- — не применимо

### Возможные улучшения (опционально)

Следующие задачи могут быть добавлены для расширения тестового покрытия:

- [ ] Добавить интеграционные тесты для `/sets` маршрутов
  - Тест: создание сета с вычислением `__total_time__`
  - Тест: проверка доступа к private сетам
  - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [ ] Добавить интеграционные тесты для `/programs` маршрутов
  - Тест: создание программы с вычислением `__total_time__`
  - Тест: проверка доступа к private программам
  - _Requirements: 3.2, 3.3, 3.4, 3.5_

- [ ] Добавить интеграционные тесты для `/dishes` маршрутов
  - Тест: CRUD операции с блюдами
  - Тест: проверка видимости public/private блюд
  - _Requirements: 5.2, 5.3, 5.4, 5.5_

- [ ] Добавить интеграционные тесты для `/meal-logs` маршрутов
  - Тест: создание MealLog с проверкой уникальности
  - Тест: добавление MealEntry с snapshot
  - Тест: получение сводки питания
  - _Requirements: 6.4, 6.5, 6.8, 6.9_

- [ ] Добавить интеграционные тесты для `/sleep-logs` маршрутов
  - Тест: создание записи сна с валидацией времени
  - Тест: получение статистики сна
  - _Requirements: 7.2, 7.3, 7.9_

- [ ] Добавить интеграционные тесты для `/profile` маршрутов
  - Тест: создание профиля с проверкой уникальности
  - Тест: обновление профиля
  - _Requirements: 8.4, 8.5, 8.6_

- [ ] Добавить интеграционные тесты для `/progress` маршрутов
  - Тест: отметка завершения сета/программы
  - Тест: получение статистики прогресса
  - Тест: получение истории завершений
  - _Requirements: 4.3, 4.4, 4.5, 4.6_
