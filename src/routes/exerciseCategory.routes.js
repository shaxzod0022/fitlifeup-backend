'use strict';

const { Router } = require('express');
const categoryController = require('../controllers/exerciseCategory.controller');
const authMiddleware = require('../middleware/auth');
const checkPermission = require('../middleware/permission');

const router = Router();

router.get('/', authMiddleware, categoryController.getAll);
router.post('/', authMiddleware, checkPermission('manage_exercises'), categoryController.create);
router.put('/:id', authMiddleware, checkPermission('manage_exercises'), categoryController.update);
router.delete('/:id', authMiddleware, checkPermission('manage_exercises'), categoryController.deleteCategory);

module.exports = router;
