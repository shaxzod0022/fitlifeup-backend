# Requirements Document

## Introduction

REST API для приложения отслеживания фитнеса, питания и сна. Система предоставляет пользователям инструменты для управления тренировочными упражнениями, сетами и программами, ведения дневника питания, записей о сне и профиля здоровья. Администраторы могут публиковать базовый каталог контента, доступный всем пользователям. API реализуется как production-ready сервис с документацией Swagger, валидацией, обработкой ошибок и unit-тестами.

## Glossary

- **System**: REST API сервер приложения fitness-tracker
- **User**: аутентифицированный пользователь приложения
- **Admin**: привилегированный пользователь с правами управления каталогом
- **Zanyatie**: упражнение — базовая единица тренировки с названием, описанием, тегами и длительностью
- **Set**: набор упражнений с параметрами повторений и пауз; содержит вычисляемое поле `__total_time__`
- **Programma**: упорядоченная коллекция сетов с вычисляемым суммарным временем
- **Blyudo**: блюдо с макронутриентами (белки, жиры, углеводы)
- **MealLog**: запись о приёме пищи за конкретный день
- **MealEntry**: отдельная позиция в приёме пищи (ссылка на блюдо или снимок)
- **SleepLog**: запись о сне с временем засыпания, пробуждения и субъективной оценкой
- **UserProfile**: профиль пользователя с антропометрическими данными и фитнес-целями
- **Snapshot**: неизменяемая копия данных блюда в момент добавления в лог питания
- **Catalog**: коллекция публичного контента, созданного Admin
- **DTO**: объект передачи данных, описывающий структуру запроса или ответа
- **ORM**: объектно-реляционный маппер (Sequelize)
- **Visibility**: флаг видимости контента: `public` (доступен всем) или `private` (только владельцу)

---

## Requirements

### Requirement 1: Управление упражнениями (Zanyatiya)

**User Story:** Как пользователь, я хочу создавать, редактировать и удалять собственные упражнения, а также просматривать публичный каталог упражнений от администратора, чтобы составлять персонализированные тренировки.

#### Acceptance Criteria

1. THE System SHALL хранить для каждого Zanyatie поля: `id`, `name` (обязательное), `subtitle`, `tags` (массив строк), `description`, `image` (URL), `time` (длительность в минутах), `visibility` (`public`/`private`), `creatorId`, `createdAt`, `updatedAt`.
2. WHEN User создаёт Zanyatie, THE System SHALL сохранить его с `creatorId` равным идентификатору User и вернуть созданный объект со статусом 201.
3. WHEN User запрашивает список Zanyatiya, THE System SHALL вернуть все Zanyatiya с `visibility = public` из каталога Admin и все Zanyatiya, принадлежащие User.
4. WHEN User запрашивает конкретное Zanyatie по `id`, THE System SHALL вернуть его, если оно принадлежит User или имеет `visibility = public`.
5. IF User запрашивает Zanyatie с `visibility = private`, принадлежащее другому User, THEN THE System SHALL вернуть ответ со статусом 403.
6. WHEN User обновляет Zanyatie, THE System SHALL применить изменения только если `creatorId` совпадает с идентификатором User.
7. IF User пытается обновить или удалить Zanyatie, принадлежащее другому User, THEN THE System SHALL вернуть ответ со статусом 403.
8. WHEN User удаляет Zanyatie, THE System SHALL удалить запись и вернуть статус 204.
9. IF запрос на создание или обновление Zanyatie содержит отсутствующее обязательное поле `name`, THEN THE System SHALL вернуть ответ со статусом 400 с описанием ошибки валидации.
10. WHERE Admin публикует Zanyatie с `visibility = public`, THE System SHALL включать его в каталог, доступный всем User.

---

### Requirement 2: Управление сетами (Sets)

**User Story:** Как пользователь, я хочу создавать сеты из упражнений с параметрами повторений и пауз, чтобы структурировать тренировочные блоки.

#### Acceptance Criteria

1. THE System SHALL хранить для каждого Set поля: `id`, `name` (обязательное), `tags` (массив строк), `level` (уровень сложности), `visibility` (`public`/`private`), `creatorId`, `createdAt`, `updatedAt`, а также массив элементов, каждый из которых содержит: ссылку на Zanyatie, `count` (повторений в цикле), `break` (пауза в секундах), `repeats` (количество циклов).
2. WHEN Set сохраняется или обновляется, THE System SHALL вычислять `__total_time__` по формуле: `sum((zanyatie.time × count × repeats) + (count × break × repeats))` для каждого элемента Set и сохранять результат.
3. WHEN User создаёт Set, THE System SHALL сохранить его с `creatorId` равным идентификатору User и вернуть созданный объект с вычисленным `__total_time__` со статусом 201.
4. WHEN User запрашивает список Sets, THE System SHALL вернуть все Sets с `visibility = public` из каталога Admin и все Sets, принадлежащие User.
5. IF Set содержит ссылку на Zanyatie с `visibility = private`, принадлежащее другому User, THEN THE System SHALL вернуть ответ со статусом 422 с описанием причины.
6. WHEN User обновляет Set, THE System SHALL пересчитать `__total_time__` и применить изменения только если `creatorId` совпадает с идентификатором User.
7. IF User пытается обновить или удалить Set, принадлежащий другому User, THEN THE System SHALL вернуть ответ со статусом 403.
8. WHEN User удаляет Set, THE System SHALL удалить запись и вернуть статус 204.
9. IF запрос на создание Set содержит отсутствующее обязательное поле `name`, THEN THE System SHALL вернуть ответ со статусом 400 с описанием ошибки валидации.

---

### Requirement 3: Управление программами (Programmy)

**User Story:** Как пользователь, я хочу создавать упорядоченные программы из сетов, чтобы планировать многодневные тренировочные циклы.

#### Acceptance Criteria

1. THE System SHALL хранить для каждой Programma поля: `id`, `name` (обязательное), `image` (URL), `subtitle`, `tags` (массив строк), `level`, `visibility` (`public`/`private`), `creatorId`, `createdAt`, `updatedAt`, а также упорядоченный массив ссылок на Sets.
2. WHEN Programma сохраняется или обновляется, THE System SHALL вычислять `__total_time__` как сумму `__total_time__` всех включённых Sets и сохранять результат.
3. WHEN User создаёт Programma, THE System SHALL сохранить её с `creatorId` равным идентификатору User и вернуть созданный объект с вычисленным `__total_time__` со статусом 201.
4. WHEN User запрашивает список Programm, THE System SHALL вернуть все Programmy с `visibility = public` из каталога Admin и все Programmy, принадлежащие User.
5. IF Programma содержит ссылку на Set с `visibility = private`, принадлежащий другому User, THEN THE System SHALL вернуть ответ со статусом 422 с описанием причины.
6. WHEN User обновляет Programma, THE System SHALL пересчитать `__total_time__` и применить изменения только если `creatorId` совпадает с идентификатором User.
7. IF User пытается обновить или удалить Programma, принадлежащую другому User, THEN THE System SHALL вернуть ответ со статусом 403.
8. WHEN User удаляет Programma, THE System SHALL удалить запись и вернуть статус 204.

---

### Requirement 4: Отслеживание прогресса тренировок

**User Story:** Как пользователь, я хочу фиксировать завершённые сеты и программы с временными метками, чтобы отслеживать прогресс и частоту тренировок.

#### Acceptance Criteria

1. THE System SHALL хранить записи о завершённых Sets: `id`, `userId`, `setId`, `completedAt` (timestamp), `durationMinutes` (фактическое время выполнения, nullable).
2. THE System SHALL хранить записи о завершённых Programmy: `id`, `userId`, `programmaId`, `completedAt` (timestamp), `durationMinutes` (nullable).
3. WHEN User отмечает Set как завершённый, THE System SHALL создать запись о завершении и вернуть её со статусом 201.
4. WHEN User отмечает Programma как завершённую, THE System SHALL создать запись о завершении и вернуть её со статусом 201.
5. WHEN User запрашивает статистику прогресса, THE System SHALL вернуть: общее количество завершённых Sets, общее количество завершённых Programm, количество тренировочных дней за последние 7 дней, количество тренировочных дней за последние 30 дней.
6. WHEN User запрашивает историю завершений, THE System SHALL вернуть список записей, отсортированных по `completedAt` в убывающем порядке, с поддержкой пагинации через параметры `limit` и `offset`.

---

### Requirement 5: Управление блюдами (Blyuda)

**User Story:** Как пользователь, я хочу создавать блюда с макронутриентами и использовать публичный каталог блюд, чтобы вести точный дневник питания.

#### Acceptance Criteria

1. THE System SHALL хранить для каждого Blyudo поля: `id`, `name` (обязательное), `description`, `image` (URL), `visibility` (`public`/`private`), `tags` (массив строк), `creatorId`, `protein` (г, nullable), `carbohydrate` (г, nullable), `fat` (г, nullable), `createdAt`, `updatedAt`.
2. WHEN User создаёт Blyudo, THE System SHALL сохранить его с `creatorId` равным идентификатору User и вернуть созданный объект со статусом 201.
3. WHEN User запрашивает список Blyud, THE System SHALL вернуть все Blyuda с `visibility = public` из каталога Admin и все Blyuda, принадлежащие User.
4. WHEN User обновляет Blyudo, THE System SHALL применить изменения только если `creatorId` совпадает с идентификатором User.
5. IF User пытается обновить или удалить Blyudo, принадлежащее другому User, THEN THE System SHALL вернуть ответ со статусом 403.
6. WHEN User удаляет Blyudo, THE System SHALL удалить запись и вернуть статус 204.
7. IF запрос на создание Blyudo содержит отсутствующее обязательное поле `name`, THEN THE System SHALL вернуть ответ со статусом 400 с описанием ошибки валидации.

---

### Requirement 6: Дневник питания (Meal Log)

**User Story:** Как пользователь, я хочу планировать приёмы пищи заранее и логировать фактически съеденные блюда, чтобы контролировать рацион.

#### Acceptance Criteria

1. THE System SHALL поддерживать статические типы приёмов пищи: `breakfast` (завтрак), `lunch` (обед), `dinner` (ужин), а также динамические: `afternoon_snack` (перекус после обеда), `evening_snack` (перекус перед сном), `custom` (пользовательский).
2. THE System SHALL хранить для каждого MealLog: `id`, `userId`, `date` (дата без времени), `mealType` (тип приёма), `customMealName` (название для типа `custom`, nullable), `createdAt`, `updatedAt`.
3. THE System SHALL хранить для каждого MealEntry: `id`, `mealLogId`, `blyudoId` (ссылка на Blyudo, nullable), `snapshot` (JSON-копия данных Blyudo в момент добавления, nullable), `useSnapshot` (boolean, определяет источник данных), `portionGrams` (вес порции в граммах, nullable), `createdAt`.
4. WHEN User добавляет Blyudo в MealLog с `useSnapshot = true`, THE System SHALL скопировать текущие данные Blyudo в поле `snapshot` MealEntry и сохранить запись.
5. WHEN User добавляет Blyudo в MealLog с `useSnapshot = false`, THE System SHALL сохранить только ссылку `blyudoId` без копирования данных.
6. WHEN User запрашивает MealLog за конкретную дату, THE System SHALL вернуть все MealLog записи User за эту дату с вложенными MealEntry и данными Blyudo (из snapshot или по ссылке в зависимости от `useSnapshot`).
7. WHEN User создаёт MealLog, THE System SHALL проверить уникальность комбинации `(userId, date, mealType)` и вернуть статус 201 при успехе.
8. IF комбинация `(userId, date, mealType)` уже существует, THEN THE System SHALL вернуть ответ со статусом 409.
9. WHEN User запрашивает сводку питания за дату, THE System SHALL вернуть суммарные значения `protein`, `carbohydrate`, `fat` по всем MealEntry за этот день.

---

### Requirement 7: Дневник сна (Sleep Log)

**User Story:** Как пользователь, я хочу записывать время засыпания и пробуждения, оценивать качество сна и фиксировать ночные пробуждения, чтобы анализировать режим сна.

#### Acceptance Criteria

1. THE System SHALL хранить для каждого SleepLog: `id`, `userId`, `sleepAt` (timestamp засыпания), `wakeAt` (timestamp пробуждения), `qualityScore` (оценка 1–5, nullable), `awakenings` (количество ночных пробуждений, nullable), `createdAt`, `updatedAt`.
2. WHEN User создаёт SleepLog, THE System SHALL сохранить запись и вернуть её со статусом 201.
3. IF `wakeAt` предшествует `sleepAt` в запросе на создание SleepLog, THEN THE System SHALL вернуть ответ со статусом 400 с описанием ошибки.
4. IF `qualityScore` выходит за пределы диапазона 1–5, THEN THE System SHALL вернуть ответ со статусом 400 с описанием ошибки валидации.
5. WHEN User запрашивает список SleepLog, THE System SHALL вернуть только записи, принадлежащие User, отсортированные по `sleepAt` в убывающем порядке, с поддержкой пагинации через параметры `limit` и `offset`.
6. WHEN User обновляет SleepLog, THE System SHALL применить изменения только если запись принадлежит User.
7. IF User пытается обновить или удалить SleepLog, принадлежащий другому User, THEN THE System SHALL вернуть ответ со статусом 403.
8. WHEN User удаляет SleepLog, THE System SHALL удалить запись и вернуть статус 204.
9. WHEN User запрашивает статистику сна за период, THE System SHALL вернуть: среднюю продолжительность сна в часах, среднюю оценку качества, среднее количество пробуждений за указанный период.

---

### Requirement 8: Профиль пользователя (UserProfile)

**User Story:** Как пользователь, я хочу заполнить профиль с антропометрическими данными и фитнес-целями, чтобы система могла учитывать их при формировании рекомендаций.

#### Acceptance Criteria

1. THE System SHALL хранить для каждого UserProfile: `id`, `userId` (уникальный), `name`, `phone` (nullable), `gender` (nullable), `age` (nullable), `height` (см, nullable), `weight` (кг, nullable), `fitnessGoal` (nullable), `workoutFrequency` (nullable), `createdAt`, `updatedAt`.
2. THE System SHALL принимать для `fitnessGoal` только значения: `weight_loss`, `muscle_gain`, `weight_maintenance`, `rehabilitation`.
3. THE System SHALL принимать для `workoutFrequency` только значения: `low` (0–1 день/неделю), `medium` (2–4 дня/неделю), `high` (5+ дней/неделю).
4. WHEN User создаёт UserProfile, THE System SHALL проверить уникальность `userId` и вернуть созданный объект со статусом 201.
5. IF UserProfile для данного User уже существует, THEN THE System SHALL вернуть ответ со статусом 409.
6. WHEN User обновляет UserProfile, THE System SHALL применить изменения и вернуть обновлённый объект.
7. IF `fitnessGoal` или `workoutFrequency` содержат значение вне допустимого перечня, THEN THE System SHALL вернуть ответ со статусом 400 с описанием ошибки валидации.
8. WHEN User запрашивает собственный UserProfile, THE System SHALL вернуть профиль, принадлежащий User.

---

### Requirement 9: Модуль аутентификации (Auth Stub)

**User Story:** Как разработчик, я хочу иметь заглушку модуля аутентификации, чтобы все эндпоинты были защищены и готовы к подключению реальной auth-системы в будущем.

#### Acceptance Criteria

1. THE System SHALL предоставлять middleware аутентификации, которое извлекает `userId` из заголовка запроса `X-User-Id` и прикрепляет его к объекту запроса.
2. IF заголовок `X-User-Id` отсутствует в запросе к защищённому эндпоинту, THEN THE System SHALL вернуть ответ со статусом 401.
3. THE System SHALL применять middleware аутентификации ко всем эндпоинтам, кроме `/health` и `/api-docs`.
4. THE System SHALL предоставлять эндпоинт `POST /auth/register` — заглушку, принимающую `name` и возвращающую объект с `userId` и сообщением о том, что реальная аутентификация будет реализована позже.
5. THE System SHALL предоставлять эндпоинт `POST /auth/login` — заглушку, возвращающую объект с `userId` и сообщением о том, что реальная аутентификация будет реализована позже.

---

### Requirement 10: Обработка ошибок и валидация

**User Story:** Как разработчик, я хочу единообразную обработку ошибок и валидацию входных данных, чтобы API возвращало понятные сообщения об ошибках.

#### Acceptance Criteria

1. THE System SHALL возвращать все ошибки в формате JSON: `{ "error": { "code": "<код>", "message": "<сообщение>", "details": [...] } }`.
2. WHEN запрос содержит невалидные данные, THE System SHALL вернуть статус 400 с перечнем нарушений валидации в поле `details`.
3. WHEN запрашиваемый ресурс не найден, THE System SHALL вернуть статус 404 с описанием отсутствующего ресурса.
4. WHEN возникает конфликт уникальности, THE System SHALL вернуть статус 409 с описанием конфликта.
5. WHEN возникает необработанная внутренняя ошибка, THE System SHALL вернуть статус 500 с общим сообщением, не раскрывая деталей реализации.
6. THE System SHALL логировать все ошибки уровня 500 с полным стек-трейсом во внутренний лог.
7. THE System SHALL предоставлять эндпоинт `GET /health`, возвращающий статус 200 с информацией о состоянии сервиса.

---

### Requirement 11: Документация API (Swagger/OpenAPI)

**User Story:** Как разработчик, я хочу автоматически генерируемую Swagger-документацию, чтобы легко изучать и тестировать все эндпоинты API.

#### Acceptance Criteria

1. THE System SHALL предоставлять Swagger UI по пути `/api-docs`, доступный без аутентификации.
2. THE System SHALL описывать все эндпоинты в формате OpenAPI 3.0, включая параметры запроса, тела запросов, схемы ответов и коды статусов.
3. THE System SHALL включать в Swagger-документацию примеры запросов и ответов для каждого эндпоинта.
4. THE System SHALL описывать в Swagger-документации схему заголовка `X-User-Id` как обязательного параметра безопасности для защищённых эндпоинтов.

---

### Requirement 12: Инфраструктура рекомендаций (Placeholder)

**User Story:** Как разработчик, я хочу иметь placeholder-инфраструктуру для будущего AI-модуля рекомендаций, чтобы архитектура была готова к его подключению.

#### Acceptance Criteria

1. THE System SHALL предоставлять эндпоинт `GET /recommendations` — заглушку, возвращающую статус 200 с сообщением о том, что модуль рекомендаций будет реализован в будущем.
2. THE System SHALL содержать файл-заглушку сервиса рекомендаций `RecommendationService` с задокументированными методами-заглушками: `getWorkoutRecommendations(userId)`, `getNutritionRecommendations(userId)`, `getSleepRecommendations(userId)`.
3. THE System SHALL структурировать заглушку так, чтобы реальная реализация могла быть подключена без изменения интерфейса сервиса.
