'use strict';

const sequelize = require('../config/database');

// Импорт инициализаторов моделей
const { User, initUser } = require('./User');
const { RefreshToken, initRefreshToken } = require('./RefreshToken');
const { BlacklistedToken, initBlacklistedToken } = require('./BlacklistedToken');
const { Exercise, initExercise } = require('./Exercise');
const { WorkoutSet, initWorkoutSet } = require('./Set');
const { SetItem, initSetItem } = require('./SetItem');
const { WorkoutProgram, initWorkoutProgram } = require('./Program');
const { ProgramSet, initProgramSet } = require('./ProgramSet');
const { Dish, initDish } = require('./Dish');
const { MealLog, initMealLog } = require('./MealLog');
const { MealEntry, initMealEntry } = require('./MealEntry');
const { SleepLog, initSleepLog } = require('./SleepLog');
const { UserProfile, initUserProfile } = require('./UserProfile');
const { CompletedSet, initCompletedSet } = require('./CompletedSet');
const { CompletedProgram, initCompletedProgram } = require('./CompletedProgram');

// Инициализация всех моделей
initUser(sequelize);
initRefreshToken(sequelize);
initBlacklistedToken(sequelize);
initExercise(sequelize);
initWorkoutSet(sequelize);
initSetItem(sequelize);
initWorkoutProgram(sequelize);
initProgramSet(sequelize);
initDish(sequelize);
initMealLog(sequelize);
initMealEntry(sequelize);
initSleepLog(sequelize);
initUserProfile(sequelize);
initCompletedSet(sequelize);
initCompletedProgram(sequelize);

// ─── Ассоциации: упражнения и сеты ───────────────────────────────────────────

// RefreshToken принадлежит User
RefreshToken.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(RefreshToken, { foreignKey: 'userId' });

// Сет содержит множество элементов
WorkoutSet.hasMany(SetItem, { foreignKey: 'setId', as: 'items' });
SetItem.belongsTo(WorkoutSet, { foreignKey: 'setId' });

// Элемент сета ссылается на упражнение
SetItem.belongsTo(Exercise, { foreignKey: 'exerciseId', as: 'exercise' });
Exercise.hasMany(SetItem, { foreignKey: 'exerciseId' });

// ─── Ассоциации: программы и сеты ────────────────────────────────────────────

// Программа содержит множество элементов-сетов
WorkoutProgram.hasMany(ProgramSet, { foreignKey: 'programId', as: 'programSets' });
ProgramSet.belongsTo(WorkoutProgram, { foreignKey: 'programId' });

// Элемент программы ссылается на сет
ProgramSet.belongsTo(WorkoutSet, { foreignKey: 'setId' });
WorkoutSet.hasMany(ProgramSet, { foreignKey: 'setId' });

// ─── Ассоциации: питание ──────────────────────────────────────────────────────

// Лог питания содержит множество позиций
MealLog.hasMany(MealEntry, { foreignKey: 'mealLogId', as: 'entries' });
MealEntry.belongsTo(MealLog, { foreignKey: 'mealLogId' });

// Позиция лога ссылается на блюдо
MealEntry.belongsTo(Dish, { foreignKey: 'dishId', as: 'dish' });
Dish.hasMany(MealEntry, { foreignKey: 'dishId' });

// ─── Синхронизация схемы БД ───────────────────────────────────────────────────

// force: false — не пересоздавать таблицы при каждом запуске
sequelize.sync({ force: false });

module.exports = {
  sequelize,
  User,
  RefreshToken,
  BlacklistedToken,
  Exercise,
  WorkoutSet,
  SetItem,
  WorkoutProgram,
  ProgramSet,
  Dish,
  MealLog,
  MealEntry,
  SleepLog,
  UserProfile,
  CompletedSet,
  CompletedProgram,
};
