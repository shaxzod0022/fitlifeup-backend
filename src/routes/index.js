'use strict';

const { Router } = require('express');

const authRoutes = require('./auth.routes');
const exercisesRoutes = require('./exercises.routes');
const setsRoutes = require('./sets.routes');
const programsRoutes = require('./programs.routes');
const dishesRoutes = require('./dishes.routes');
const mealLogsRoutes = require('./mealLogs.routes');
const sleepLogsRoutes = require('./sleepLogs.routes');
const userProfileRoutes = require('./userProfile.routes');
const progressRoutes = require('./progress.routes');
const recommendationsRoutes = require('./recommendations.routes');
const healthRoutes = require('./health.routes');
const adminRoutes = require('./admin.routes');

const router = Router();

/**
 * Корневой роутер приложения.
 *
 * Маршруты /health и /auth/* не требуют аутентификации —
 * auth middleware не применяется на уровне роутера, так как
 * каждый файл маршрутов самостоятельно управляет своим auth middleware.
 *
 * Validates: Requirement 9.3
 */

// Публичные маршруты (без auth middleware)
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

// Защищённые маршруты (auth middleware применяется внутри каждого файла маршрутов)
router.use('/exercises', exercisesRoutes);
router.use('/sets', setsRoutes);
router.use('/programs', programsRoutes);
router.use('/dishes', dishesRoutes);
router.use('/meal-logs', mealLogsRoutes);
router.use('/sleep-logs', sleepLogsRoutes);
router.use('/profile', userProfileRoutes);
router.use('/progress', progressRoutes);
router.use('/recommendations', recommendationsRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
