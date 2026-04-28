'use strict';

const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staff.controller');
const authMiddleware = require('../middleware/auth');
const checkPermission = require('../middleware/permission');

// All routes require superadmin or specific permission
router.use(authMiddleware);

router.get('/', checkPermission('manage_users'), staffController.getStaffList);
router.post('/', checkPermission('manage_users'), staffController.createStaff);
router.put('/:id', checkPermission('manage_users'), staffController.updateStaff);
router.delete('/:id', checkPermission('manage_users'), staffController.deleteStaff);

module.exports = router;
