'use strict';

const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const checkPermission = require('../middleware/permission');
const adminController = require('../controllers/admin.controller');

const router = Router();

// Apply auth middleware to all admin routes
router.use(authMiddleware);

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
router.get('/users', checkPermission('view_users'), adminController.getAllUsers);
router.get('/users/:id', checkPermission('view_users'), adminController.getUserDetails);
router.put('/users/:id', checkPermission('manage_users'), adminController.updateUser);

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get global platform statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', checkPermission('view_accounting'), adminController.getGlobalStats);

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Delete a user by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/users/:id', checkPermission('manage_users'), adminController.deleteUser);

module.exports = router;
