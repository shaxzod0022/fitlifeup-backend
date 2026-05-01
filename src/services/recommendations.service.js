'use strict';

const { UserProfile } = require('../models');

/**
 * AI-рекомендации на основе профиля пользователя.
 * Validates: Requirements 12.1, 12.2, 12.3
 */

/**
 * Возвращает рекомендации по тренировкам для пользователя.
 * @param {number} userId
 */
async function getWorkoutRecommendations(userId) {
  const profile = await UserProfile.findOne({ where: { userId } });
  
  let message = "Bugungi mashg'ulot: Tanangizni harakatga keltiring!";
  let intensity = "O'rtacha";
  let duration = "20 daqiqa";

  if (profile) {
    if (profile.fitnessGoal === 'rehabilitation') {
      message = "Bugungi mashg'ulot: Umurtqa pog'onasini tiklash va moslashuvchanlik.";
      intensity = "Past";
      duration = "15 daqiqa";
    } else if (profile.fitnessGoal === 'muscle_gain') {
      message = "Bugungi mashg'ulot: Kuch mashqlari va mushak o'sishi.";
      intensity = "Yuqori";
      duration = "45 daqiqa";
    } else if (profile.fitnessGoal === 'weight_loss') {
      message = "Bugungi mashg'ulot: Kardio va kaloriya yo'qotish.";
      intensity = "O'rtacha";
      duration = "30 daqiqa";
    }
  }

  return {
    userId,
    type: 'workout',
    message,
    intensity,
    duration,
    recommendations: [],
  };
}

/**
 * Возвращает рекомендации по питанию для пользователя.
 * @param {number} userId
 */
async function getNutritionRecommendations(userId) {
  const profile = await UserProfile.findOne({ where: { userId } });
  let kcal = 2000;
  
  if (profile) {
    if (profile.fitnessGoal === 'weight_loss') kcal = 1800;
    if (profile.fitnessGoal === 'muscle_gain') kcal = 2500;
  }

  return {
    userId,
    type: 'nutrition',
    targetKcal: kcal,
    currentKcal: 0,
    message: `Sizning kunlik kaloriya maqsadingiz: ${kcal} kcal`,
    recommendations: [],
  };
}

/**
 * Возвращает рекомендации по сну для пользователя.
 * @param {number} userId
 */
async function getSleepRecommendations(userId) {
  return {
    userId,
    type: 'sleep',
    targetDuration: "8s",
    currentDuration: "0s",
    quality: "90%",
    message: "Yaxshi uyqu - tezkor tiklanish garovi.",
    recommendations: [],
  };
}

module.exports = {
  getWorkoutRecommendations,
  getNutritionRecommendations,
  getSleepRecommendations,
};
