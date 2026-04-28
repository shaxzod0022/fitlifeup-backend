'use strict';

const { User } = require('../models/User');
const { UserProfile } = require('../models/UserProfile');
const { CompletedSet } = require('../models/CompletedSet');
const { CompletedProgram } = require('../models/CompletedProgram');

/**
 * Get all users for admin panel
 */
async function getAllUsers(req, res, next) {
  try {
    const users = await User.findAll({
      attributes: ['id', 'email', 'role', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    
    // Also fetch profiles
    const profiles = await UserProfile.findAll();
    const profileMap = {};
    profiles.forEach(p => {
      profileMap[p.userId] = p;
    });

    const result = users.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      profile: profileMap[user.id] || null
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get global platform stats
 */
async function getGlobalStats(req, res, next) {
  try {
    const totalUsers = await User.count();
    const totalCompletedSets = await CompletedSet.count();
    const totalCompletedPrograms = await CompletedProgram.count();
    
    res.json({
      totalUsers,
      totalCompletedSets,
      totalCompletedPrograms
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete user and all associated data
 */
async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    
    // Prevent admin from deleting themselves
    if (id === req.userId) {
      return res.status(400).json({ error: { message: "O'z akkauntingizni o'chira olmaysiz" } });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: { message: 'Foydalanuvchi topilmadi' } });
    }

    await user.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllUsers,
  getGlobalStats,
  deleteUser
};
