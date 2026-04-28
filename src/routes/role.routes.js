'use strict';

const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const checkPermission = require('../middleware/permission');
const roleController = require('../controllers/role.controller');

const router = Router();

// All role management routes require authentication and 'manage_roles' permission
router.use(authMiddleware);

router.get('/', checkPermission('view_roles'), roleController.getRoles);
router.get('/permissions', checkPermission('manage_roles'), roleController.getPermissions);
router.post('/', checkPermission('manage_roles'), roleController.createRole);
router.put('/:id', checkPermission('manage_roles'), roleController.updateRole);
router.delete('/:id', checkPermission('manage_roles'), roleController.deleteRole);
router.post('/assign', checkPermission('manage_roles'), roleController.assignRole);

module.exports = router;
