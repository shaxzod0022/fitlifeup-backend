'use strict';

const { ExerciseCategory } = require('../models');
const { ValidationError } = require('../utils/errors');

/**
 * GET /api/admin/exercise-categories
 */
async function getAll(req, res, next) {
  try {
    const categories = await ExerciseCategory.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/exercise-categories
 */
async function create(req, res, next) {
  try {
    const { name, description } = req.body;
    if (!name) {
      throw new ValidationError('Kategoriya nomi majburiy');
    }
    const category = await ExerciseCategory.create({ name, description });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/exercise-categories/:id
 */
async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const category = await ExerciseCategory.findByPk(id);
    if (!category) {
      throw new ValidationError('Kategoriya topilmadi');
    }
    await category.update({ name, description });
    res.json(category);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/admin/exercise-categories/:id
 */
async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;
    const category = await ExerciseCategory.findByPk(id);
    if (!category) {
      throw new ValidationError('Kategoriya topilmadi');
    }
    await category.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAll,
  create,
  update,
  deleteCategory
};
