'use strict';

const express = require('express');
const router = express.Router();
const sleepController = require('../controllers/sleep.controller');
const authMiddleware = require('../middleware/auth');

/**
 * @route POST /api/sleep/analyze
 * @desc Анализ данных сна с помощью AI
 * @access Private
 */
router.post('/analyze', authMiddleware, sleepController.analyzeSleep);

module.exports = router;
