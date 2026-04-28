# Fitness Tracker API

REST API для отслеживания фитнеса, питания и сна. Позволяет пользователям управлять упражнениями, тренировочными сетами и программами, вести дневник питания и сна, а также отслеживать прогресс.

## Содержание

- [Технологии](#технологии)
- [Быстрый старт](#быстрый-старт)
- [Переменные окружения](#переменные-окружения)
- [Аутентификация](#аутентификация)
- [API Endpoints](#api-endpoints)
- [Модели данных](#модели-данных)
- [Обработка ошибок](#обработка-ошибок)
- [Архитектура проекта](#архитектура-проекта)

---

## Технологии

| Компонент | Технология |
|---|---|
| Runtime | Node.js |
| Framework | Express.js 4.22 |
| База данных | SQLite + Sequelize ORM 6 |
| Аутентификация | JWT (jsonwebtoken 9) |
| Хэширование паролей | bcrypt 6 |
| Валидация | express-validator 7 |
| Логирование | Winston 3 |
| Документация API | Swagger UI (swagger-jsdoc + swagger-ui-express) |
| Тестирование | Jest 29, supertest, fast-check |

---

## Быстрый старт

```bash
# Установить зависимости
npm install

# Создать файл окружения
cp .env.example .env
# Заполнить JWT_SECRET (минимум 32 символа)

# Запустить сервер
npm start
```

Сервер запустится на `http://localhost:3000`.

Swagger-документация доступна по адресу: `http://localhost:3000/api-docs`

---

## Переменные окружения

Скопируйте `.env.example` в `.env` и заполните значения.

| Переменная | Обязательная | По умолчанию | Описание |
|---|---|---|---|
| `JWT_SECRET` | **Да** | — | Секрет для подписи JWT-токенов. Минимум 32 символа |
| `JWT_ACCESS_EXPIRY` | Нет | `15m` | Время жизни access-токена. Формат: `15m`, `1h` |
| `JWT_REFRESH_EXPIRY` | Нет | `7d` | Время жизни refresh-токена. Формат: `7d`, `30d` |
| `BCRYPT_SALT_ROUNDS` | Нет | `10` | Количество раундов bcrypt. Минимум 10 |
| `PORT` | Нет | `3000` | Порт сервера |
| `DB_PATH` | Нет | `./database.sqlite` | Путь к файлу SQLite |

---

## Аутентификация

API использует JWT Bearer-токены.

### Схема работы

1. Зарегистрируйтесь: `POST /api/auth/register`
2. Войдите: `POST /api/auth/login` — получите `accessToken` и `refreshToken`
3. Передавайте `accessToken` в заголовке всех защищённых запросов:
   ```
   Authorization: Bearer <accessToken>
   ```
4. Когда `accessToken` истечёт (через 15 мин), обновите его: `POST /api/auth/refresh`
5. При выходе отзовите токены: `POST /api/auth/logout`

### Особенности

- Access-токен живёт **15 минут** (настраивается через `JWT_ACCESS_EXPIRY`)
- Refresh-токен живёт **7 дней** (настраивается через `JWT_REFRESH_EXPIRY`)
- Refresh-токены хранятся в базе данных
- Отозванные токены попадают в чёрный список (таблица `BlacklistedTokens`)
- Алгоритм подписи: HS256

---

## API Endpoints

Базовый URL: `/api`

### Публичные маршруты (без аутентификации)

#### Health

| Метод | Путь | Описание |
|---|---|---|
| GET | `/health` | Проверка состояния сервиса |

#### Auth

| Метод | Путь | Описание |
|---|---|---|
| POST | `/auth/register` | Регистрация нового пользователя |
| POST | `/auth/login` | Вход и получение токенов |
| POST | `/auth/refresh` | Обновление access-токена |
| POST | `/auth/logout` | Выход и отзыв токенов |

---

### Защищённые маршруты (требуют `Authorization: Bearer <token>`)

#### Упражнения `/exercises`

| Метод | Путь | Описание |
|---|---|---|
| GET | `/exercises` | Список публичных + своих упражнений |
| POST | `/exercises` | Создать упражнение |
| GET | `/exercises/:id` | Получить упражнение по ID |
| PUT | `/exercises/:id` | Обновить упражнение |
| DELETE | `/exercises/:id` | Удалить упражнение |

#### Сеты (тренировки) `/sets`

| Метод | Путь | Описание |
|---|---|---|
| GET | `/sets` | Список публичных + своих сетов |
| POST | `/sets` | Создать сет с упражнениями |
| GET | `/sets/:id` | Получить сет по ID |
| PUT | `/sets/:id` | Обновить сет |
| DELETE | `/sets/:id` | Удалить сет |

#### Программы `/programs`

| Метод | Путь | Описание |
|---|---|---|
| GET | `/programs` | Список публичных + своих программ |
| POST | `/programs` | Создать программу с сетами |
| GET | `/programs/:id` | Получить программу по ID |
| PUT | `/programs/:id` | Обновить программу |
| DELETE | `/programs/:id` | Удалить программу |

#### Блюда `/dishes`

| Метод | Путь | Описание |
|---|---|---|
| GET | `/dishes` | Список публичных + своих блюд |
| POST | `/dishes` | Создать блюдо |
| GET | `/dishes/:id` | Получить блюдо по ID |
| PUT | `/dishes/:id` | Обновить блюдо |
| DELETE | `/dishes/:id` | Удалить блюдо |

#### Дневник питания `/meal-logs`

| Метод | Путь | Описание |
|---|---|---|
| GET | `/meal-logs?date=YYYY-MM-DD` | Записи питания за дату |
| POST | `/meal-logs` | Создать запись питания |
| GET | `/meal-logs/:id` | Получить запись с позициями |
| POST | `/meal-logs/:id/entries` | Добавить позицию в запись |
| GET | `/meal-logs/summary?date=YYYY-MM-DD` | Сводка макронутриентов за день |

#### Дневник сна `/sleep-logs`

| Метод | Путь | Описание |
|---|---|---|
| GET | `/sleep-logs` | Список записей сна (с пагинацией) |
| POST | `/sleep-logs` | Создать запись сна |
| GET | `/sleep-logs/:id` | Получить запись по ID |
| PUT | `/sleep-logs/:id` | Обновить запись |
| DELETE | `/sleep-logs/:id` | Удалить запись |
| GET | `/sleep-logs/stats?startDate=&endDate=` | Статистика сна за период |

#### Прогресс `/progress`

| Метод | Путь | Описание |
|---|---|---|
| POST | `/progress/sets/:setId/complete` | Отметить сет как выполненный |
| POST | `/progress/programs/:programId/complete` | Отметить программу как выполненную |
| GET | `/progress/stats` | Статистика прогресса |
| GET | `/progress/history` | История выполнений (с пагинацией) |

#### Профиль пользователя `/profile`

| Метод | Путь | Описание |
|---|---|---|
| POST | `/profile` | Создать профиль |
| GET | `/profile` | Получить профиль |
| PUT | `/profile` | Обновить профиль |

#### Рекомендации `/recommendations`

| Метод | Путь | Описание |
|---|---|---|
| GET | `/recommendations` | Получить рекомендации (заглушка) |

---

## Модели данных

### User

| Поле | Тип | Описание |
|---|---|---|
| id | INTEGER (PK, auto) | Идентификатор |
| email | STRING (unique) | Email пользователя |
| passwordHash | STRING | Хэш пароля (bcrypt) |

### Exercise (Упражнение)

| Поле | Тип | Описание |
|---|---|---|
| id | UUID | Идентификатор |
| name | STRING | Название |
| subtitle | STRING | Подзаголовок |
| tags | JSON | Теги |
| description | TEXT | Описание |
| image | STRING | URL изображения |
| time | FLOAT | Время выполнения (минуты) |
| visibility | ENUM | `public` / `private` |
| creatorId | STRING | ID создателя |

### WorkoutSet (Сет)

| Поле | Тип | Описание |
|---|---|---|
| id | UUID | Идентификатор |
| name | STRING | Название |
| tags | JSON | Теги |
| level | STRING | Уровень сложности |
| visibility | ENUM | `public` / `private` |
| creatorId | STRING | ID создателя |
| __total_time__ | FLOAT | Суммарное время (мин, вычисляется автоматически) |

**Формула расчёта времени сета:**
```
sum((exercise.time × count × repeats) + (count × break_seconds/60 × repeats))
```

### SetItem (Элемент сета)

| Поле | Тип | Описание |
|---|---|---|
| id | UUID | Идентификатор |
| setId | UUID (FK) | Ссылка на сет |
| exerciseId | UUID (FK) | Ссылка на упражнение |
| count | INTEGER | Количество подходов |
| break | INTEGER | Пауза между подходами (секунды) |
| repeats | INTEGER | Количество повторений |
| order | INTEGER | Порядок в сете |

### WorkoutProgram (Программа)

| Поле | Тип | Описание |
|---|---|---|
| id | UUID | Идентификатор |
| name | STRING | Название |
| image | STRING | URL изображения |
| subtitle | STRING | Подзаголовок |
| tags | JSON | Теги |
| level | STRING | Уровень сложности |
| visibility | ENUM | `public` / `private` |
| creatorId | STRING | ID создателя |
| __total_time__ | FLOAT | Суммарное время (мин, сумма времён сетов) |

### Dish (Блюдо)

| Поле | Тип | Описание |
|---|---|---|
| id | UUID | Идентификатор |
| name | STRING | Название |
| description | TEXT | Описание |
| image | STRING | URL изображения |
| visibility | ENUM | `public` / `private` |
| tags | JSON | Теги |
| creatorId | STRING | ID создателя |
| protein | FLOAT | Белки (г) |
| carbohydrate | FLOAT | Углеводы (г) |
| fat | FLOAT | Жиры (г) |

### MealLog (Запись питания)

| Поле | Тип | Описание |
|---|---|---|
| id | UUID | Идентификатор |
| userId | STRING | ID пользователя |
| date | DATEONLY | Дата (YYYY-MM-DD) |
| mealType | ENUM | `breakfast`, `lunch`, `dinner`, `afternoon_snack`, `evening_snack`, `custom` |
| customMealName | STRING | Название (для типа `custom`) |

Уникальный индекс: `(userId, date, mealType)`.

### MealEntry (Позиция в записи питания)

| Поле | Тип | Описание |
|---|---|---|
| id | UUID | Идентификатор |
| mealLogId | UUID (FK) | Ссылка на MealLog |
| dishId | UUID (FK, nullable) | Ссылка на блюдо |
| useSnapshot | BOOLEAN | Использовать снимок данных блюда |
| snapshot | JSON | Снимок данных блюда на момент добавления |
| portionGrams | FLOAT | Размер порции (г) |

> При `useSnapshot: true` данные блюда копируются в `snapshot`, что позволяет сохранить историческую информацию даже при изменении блюда.

### SleepLog (Запись сна)

| Поле | Тип | Описание |
|---|---|---|
| id | UUID | Идентификатор |
| userId | STRING | ID пользователя |
| sleepAt | DATE | Время засыпания |
| wakeAt | DATE | Время пробуждения |
| qualityScore | INTEGER | Оценка качества сна (1–5) |
| awakenings | INTEGER | Количество пробуждений |

### UserProfile (Профиль пользователя)

| Поле | Тип | Описание |
|---|---|---|
| id | UUID | Идентификатор |
| userId | STRING (unique) | ID пользователя |
| name | STRING | Имя |
| phone | STRING | Телефон |
| gender | STRING | Пол |
| age | INTEGER | Возраст |
| height | FLOAT | Рост (см) |
| weight | FLOAT | Вес (кг) |
| fitnessGoal | ENUM | `weight_loss`, `muscle_gain`, `weight_maintenance`, `rehabilitation` |
| workoutFrequency | ENUM | `low`, `medium`, `high` |

---

## Обработка ошибок

Все ошибки возвращаются в едином формате:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Описание ошибки",
    "details": []
  }
}
```

| HTTP-статус | Код | Описание |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Ошибка валидации входных данных |
| 401 | `UNAUTHORIZED` | Требуется аутентификация / токен недействителен |
| 403 | `FORBIDDEN` | Доступ запрещён (чужой ресурс) |
| 404 | `NOT_FOUND` | Ресурс не найден |
| 409 | `CONFLICT` | Конфликт (ресурс уже существует) |
| 422 | `UNPROCESSABLE_ENTITY` | Невозможно обработать запрос |
| 500 | `INTERNAL_SERVER_ERROR` | Внутренняя ошибка сервера |

---

## Архитектура проекта

```
src/
├── index.js              # Точка входа, запуск сервера
├── app.js                # Express-приложение, middleware, роутер
├── config/
│   ├── database.js       # Подключение к SQLite через Sequelize
│   ├── env.js            # Валидация и чтение переменных окружения
│   └── swagger.js        # Конфигурация Swagger/OpenAPI
├── routes/               # Маршруты (по одному файлу на ресурс)
├── controllers/          # Обработчики HTTP-запросов
├── services/             # Бизнес-логика
├── models/               # Sequelize-модели
├── middleware/
│   ├── auth.js           # JWT-аутентификация
│   ├── validate.js       # Валидация входных данных
│   └── errorHandler.js   # Глобальный обработчик ошибок
├── validators/           # Правила валидации express-validator
└── utils/
    ├── errors.js         # Кастомные классы ошибок
    └── logger.js         # Winston-логгер
tests/
├── unit/                 # Юнит-тесты (сервисы, модели, middleware)
└── integration/          # Интеграционные тесты (маршруты, auth)
```

### Принципы видимости контента

Для упражнений, сетов, программ и блюд действует единая логика:
- `public` — доступно всем аутентифицированным пользователям
- `private` — доступно только создателю

При создании сета или программы нельзя использовать приватные ресурсы других пользователей.

### Тестирование

```bash
# Запустить все тесты
npm test

# Запустить один файл
npx jest tests/unit/services/auth.service.test.js
```

Проект включает:
- Юнит-тесты сервисов, моделей и middleware
- Интеграционные тесты маршрутов
- Property-based тесты (fast-check) для критических компонентов
