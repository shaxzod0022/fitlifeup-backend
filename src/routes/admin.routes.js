'use strict';

const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const requireAdmin = require('../middleware/adminAuth');
const adminController = require('../controllers/admin.controller');

const router = Router();

// Apply auth and admin middleware to all admin routes
router.use(authMiddleware);
router.use(requireAdmin);

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management endpoints
 */

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/users', adminController.getAllUsers);

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get global platform statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', adminController.getGlobalStats);

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Delete a user by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;
