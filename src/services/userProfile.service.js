'use strict';

const { UserProfile } = require('../models/index');
const { NotFoundError, ConflictError, ValidationError } = require('../utils/errors');

const VALID_FITNESS_GOALS = ['weight_loss', 'muscle_gain', 'weight_maintenance', 'rehabilitation'];
const VALID_WORKOUT_FREQUENCIES = ['low', 'medium', 'high'];

/**
 * Создать профиль пользователя.
 * Проверяет уникальность userId — возвращает 409, если профиль уже существует.
 * Валидирует fitnessGoal и workoutFrequency.
 * Requirement 8.4, 8.5, 8.7
 * @param {string} userId - Идентификатор пользователя
 * @param {object} data - Данные профиля (name, phone, gender, age, height, weight, fitnessGoal, workoutFrequency)
 * @returns {Promise<UserProfile>} Созданный профиль
 * @throws {ConflictError} Если профиль для данного userId уже существует
 * @throws {ValidationError} Если fitnessGoal или workoutFrequency содержат недопустимое значение
 */
async function createProfile(userId, data) {
  if (data.fitnessGoal !== undefined && data.fitnessGoal !== null) {
    if (!VALID_FITNESS_GOALS.includes(data.fitnessGoal)) {
      throw new ValidationError(
        `Поле fitnessGoal должно быть одним из: ${VALID_FITNESS_GOALS.join(', ')}`
      );
    }
  }

  if (data.workoutFrequency !== undefined && data.workoutFrequency !== null) {
    if (!VALID_WORKOUT_FREQUENCIES.includes(data.workoutFrequency)) {
      throw new ValidationError(
        `Поле workoutFrequency должно быть одним из: ${VALID_WORKOUT_FREQUENCIES.join(', ')}`
      );
    }
  }

  const existing = await UserProfile.findOne({ where: { userId } });

  if (existing) {
    throw new ConflictError(`Профиль для пользователя ${userId} уже существует`);
  }

  const profile = await UserProfile.create({ ...data, userId });
  return profile;
}

/**
 * Получить профиль пользователя.
 * Requirement 8.8
 * @param {string} userId - Идентификатор пользователя
 * @returns {Promise<UserProfile>} Профиль пользователя
 * @throws {NotFoundError} Если профиль не найден
 */
async function getProfile(userId) {
  const profile = await UserProfile.findOne({ where: { userId } });

  if (!profile) {
    throw new NotFoundError(`Профиль пользователя ${userId} не найден`);
  }

  return profile;
}

/**
 * Обновить профиль пользователя.
 * Requirement 8.6
 * @param {string} userId - Идентификатор пользователя
 * @param {object} data - Обновляемые данные профиля
 * @returns {Promise<UserProfile>} Обновлённый профиль
 * @throws {NotFoundError} Если профиль не найден
 */
async function updateProfile(userId, data) {
  const profile = await UserProfile.findOne({ where: { userId } });

  if (!profile) {
    throw new NotFoundError(`Профиль пользователя ${userId} не найден`);
  }

  await profile.update(data);
  return profile;
}

module.exports = {
  createProfile,
  getProfile,
  updateProfile,
};
