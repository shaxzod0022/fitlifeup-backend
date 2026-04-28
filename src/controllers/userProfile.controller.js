'use strict';

const userProfileService = require('../services/userProfile.service');

/**
 * Контроллер для управления профилем пользователя (UserProfile).
 * Validates: Requirements 8.4, 8.6, 8.8
 */

/**
 * POST /profile
 * Создать профиль пользователя.
 */
async function create(req, res, next) {
  try {
    const profile = await userProfileService.createProfile(req.userId, req.body);
    res.status(201).json(profile);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /profile
 * Получить профиль пользователя.
 */
async function get(req, res, next) {
  try {
    const profile = await userProfileService.getProfile(req.userId);
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /profile
 * Обновить профиль пользователя.
 */
async function update(req, res, next) {
  try {
    const profile = await userProfileService.updateProfile(req.userId, req.body);
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  get,
  update,
};
