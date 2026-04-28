'use strict';

/**
 * Заглушка сервиса AI-рекомендаций.
 * Интерфейс зафиксирован для будущей реализации без изменения контракта.
 * Validates: Requirements 12.1, 12.2, 12.3
 */

const STUB_MESSAGE = 'Модуль рекомендаций будет реализован в будущем.';

/**
 * Возвращает рекомендации по тренировкам для пользователя.
 * TODO: реализовать с использованием AI-модуля.
 * @param {string} userId
 * @returns {Promise<object>} объект с рекомендациями
 */
async function getWorkoutRecommendations(userId) {
  return {
    userId,
    type: 'workout',
    message: STUB_MESSAGE,
    recommendations: [],
  };
}

/**
 * Возвращает рекомендации по питанию для пользователя.
 * TODO: реализовать с использованием AI-модуля.
 * @param {string} userId
 * @returns {Promise<object>} объект с рекомендациями
 */
async function getNutritionRecommendations(userId) {
  return {
    userId,
    type: 'nutrition',
    message: STUB_MESSAGE,
    recommendations: [],
  };
}

/**
 * Возвращает рекомендации по сну для пользователя.
 * TODO: реализовать с использованием AI-модуля.
 * @param {string} userId
 * @returns {Promise<object>} объект с рекомендациями
 */
async function getSleepRecommendations(userId) {
  return {
    userId,
    type: 'sleep',
    message: STUB_MESSAGE,
    recommendations: [],
  };
}

module.exports = {
  getWorkoutRecommendations,
  getNutritionRecommendations,
  getSleepRecommendations,
};
