'use strict';

const { UserProfile } = require('../models');
const geminiService = require('./gemini.service');

/**
 * AI-рекомендации на основе профиля пользователя с использованием Google Gemini.
 */

/**
 * Возвращает рекомендации по тренировкам для пользователя.
 */
async function getWorkoutRecommendations(userId) {
  const profile = await UserProfile.findOne({ where: { userId } });
  
  let message = "Bugungi mashg'ulot: Tanangizni harakatga keltiring!";
  let intensity = "O'rtacha";
  let duration = "20 daqiqa";

  if (profile) {
    const prompt = `Foydalanuvchi ma'lumotlari: Yosh: ${profile.age}, Jins: ${profile.gender}, Vazn: ${profile.weight}kg, Bo'y: ${profile.height}sm, Maqsad: ${profile.fitnessGoal}. 
    Shu foydalanuvchi uchun bugungi mashg'ulot tavsiyasini quyidagi formatda JSON sifatida qaytar (faqat JSON):
    {"message": "...", "intensity": "...", "duration": "..."}
    Til: O'zbekcha.`;

    const aiResponse = await geminiService.generateContent(prompt);
    if (aiResponse) {
      try {
        const cleaned = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        message = parsed.message || message;
        intensity = parsed.intensity || intensity;
        duration = parsed.duration || duration;
      } catch (e) {
        console.error('Failed to parse AI response for workout:', e);
      }
    } else {
      // Fallback logic
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
 */
async function getNutritionRecommendations(userId) {
  const profile = await UserProfile.findOne({ where: { userId } });
  let kcal = 2000;
  let message = `Sizning kunlik kaloriya maqsadingiz: ${kcal} kcal`;
  
  if (profile) {
    const prompt = `Foydalanuvchi ma'lumotlari: Yosh: ${profile.age}, Jins: ${profile.gender}, Vazn: ${profile.weight}kg, Bo'y: ${profile.height}sm, Maqsad: ${profile.fitnessGoal}. 
    Shu foydalanuvchi uchun kunlik kaloriya va tavsiyasini quyidagi formatda JSON sifatida qaytar (faqat JSON):
    {"kcal": 2200, "message": "..."}
    Til: O'zbekcha.`;

    const aiResponse = await geminiService.generateContent(prompt);
    if (aiResponse) {
      try {
        const cleaned = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        kcal = parsed.kcal || kcal;
        message = parsed.message || message;
      } catch (e) {
        console.error('Failed to parse AI response for nutrition:', e);
      }
    } else {
      if (profile.fitnessGoal === 'weight_loss') kcal = 1800;
      if (profile.fitnessGoal === 'muscle_gain') kcal = 2500;
      message = `Sizning kunlik kaloriya maqsadingiz: ${kcal} kcal`;
    }
  }

  return {
    userId,
    type: 'nutrition',
    targetKcal: kcal,
    currentKcal: 0,
    message,
    recommendations: [],
  };
}

/**
 * Возвращает рекомендации по сну для пользователя.
 */
async function getSleepRecommendations(userId) {
  const profile = await UserProfile.findOne({ where: { userId } });
  let targetDuration = "8s";
  let message = "Yaxshi uyqu - tezkor tiklanish garovi.";

  if (profile) {
    const prompt = `Foydalanuvchi ma'lumotlari: Yosh: ${profile.age}, Maqsad: ${profile.fitnessGoal}. 
    Shu foydalanuvchi uchun uyqu tavsiyasini quyidagi formatda JSON sifatida qaytar (faqat JSON):
    {"duration": "8s", "message": "..."}
    Til: O'zbekcha.`;

    const aiResponse = await geminiService.generateContent(prompt);
    if (aiResponse) {
      try {
        const cleaned = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        targetDuration = parsed.duration || targetDuration;
        message = parsed.message || message;
      } catch (e) {
        console.error('Failed to parse AI response for sleep:', e);
      }
    }
  }

  return {
    userId,
    type: 'sleep',
    targetDuration,
    currentDuration: "0s",
    quality: "90%",
    message,
    recommendations: [],
  };
}

module.exports = {
  getWorkoutRecommendations,
  getNutritionRecommendations,
  getSleepRecommendations,
};
