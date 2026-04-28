'use strict';

/**
 * Контроллер рекомендаций (заглушка).
 * Validates: Requirements 12.1, 12.2, 12.3
 */

const recommendationsService = require('../services/recommendations.service');

/**
 * GET /recommendations
 * Возвращает заглушку рекомендаций с сообщением о будущей реализации.
 */
async function getRecommendations(req, res, next) {
  try {
    const userId = req.userId;

    const [workout, nutrition, sleep] = await Promise.all([
      recommendationsService.getWorkoutRecommendations(userId),
      recommendationsService.getNutritionRecommendations(userId),
      recommendationsService.getSleepRecommendations(userId),
    ]);

    res.status(200).json({
      message: 'Модуль рекомендаций будет реализован в будущем.',
      data: {
        workout,
        nutrition,
        sleep,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getRecommendations,
};
