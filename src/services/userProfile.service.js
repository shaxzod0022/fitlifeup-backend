'use strict';

const { UserProfile, User } = require('../models/index');
const passwordService = require('./password.service');
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

  const user = await User.findByPk(userId);
  if (!user) throw new NotFoundError(`Foydalanuvchi ${userId} topilmadi`);

  // Update User table fields if provided
  let userChanged = false;
  if (data.email && data.email !== user.email) {
    user.email = data.email;
    userChanged = true;
  }
  if (data.password && data.password.trim() !== '') {
    user.passwordHash = await passwordService.hash(data.password);
    userChanged = true;
  }
  if (userChanged) await user.save();

  const profile = await UserProfile.create({ ...data, userId });
  return getProfile(userId);
}

/**
 * Получить профиль пользователя.
 * Requirement 8.8
 * @param {string} userId - Идентификатор пользователя
 * @returns {Promise<UserProfile>} Профиль пользователя
 * @throws {NotFoundError} Если профиль не найден
 */
async function getProfile(userId) {
  const profile = await UserProfile.findOne({ 
    where: { userId },
    include: [{ model: User, as: 'user', attributes: ['email'] }]
  });

  if (!profile) {
    // If profile doesn't exist, return basic user info at least
    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundError(`Foydalanuvchi ${userId} topilmadi`);
    return { email: user.email, firstName: '', lastName: '', phone: '' };
  }

  return {
    ...profile.toJSON(),
    email: profile.user?.email || profile.email
  };
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
  const user = await User.findByPk(userId);

  if (!user) {
    throw new NotFoundError(`Foydalanuvchi ${userId} topilmadi`);
  }

  // Update User table fields
  let userChanged = false;
  if (data.email && data.email !== user.email) {
    user.email = data.email;
    userChanged = true;
  }
  if (data.password && data.password.trim() !== '') {
    user.passwordHash = await passwordService.hash(data.password);
    userChanged = true;
  }
  
  if (userChanged) {
    await user.save();
  }

  // Update UserProfile table fields
  if (profile) {
    await profile.update(data);
  } else {
    await UserProfile.create({ ...data, userId });
  }

  return getProfile(userId);
}

module.exports = {
  createProfile,
  getProfile,
  updateProfile,
};
