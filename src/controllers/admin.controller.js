'use strict';

const { User, Role } = require('../models');
const { UserProfile } = require('../models/UserProfile');
const { CompletedSet } = require('../models/CompletedSet');
const { CompletedProgram } = require('../models/CompletedProgram');

/**
 * Get all users for admin panel
 */
async function getAllUsers(req, res, next) {
  try {
    const users = await User.findAll({
      attributes: ['id', 'email', 'createdAt'],
      include: [
        { model: Role, as: 'role' },
        { model: UserProfile, as: 'profile' }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    const result = users
      .filter(user => user.role && user.role.name !== 'superadmin')
      .map(user => ({
        id: user.id,
        email: user.email,
        role: user.role.name,
        createdAt: user.createdAt,
        profile: user.profile
      }));

    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get single user details with all stats
 */
async function getUserDetails(req, res, next) {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      include: [
        { model: Role, as: 'role' },
        { model: UserProfile, as: 'profile' }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: { message: 'Foydalanuvchi topilmadi' } });
    }

    // Get some stats
    const [completedSetsCount, completedProgramsCount] = await Promise.all([
      CompletedSet.count({ where: { userId: id } }),
      CompletedProgram.count({ where: { userId: id } })
    ]);

    res.json({
      id: user.id,
      email: user.email,
      role: user.role ? user.role.name : 'user',
      createdAt: user.createdAt,
      profile: user.profile,
      stats: {
        completedSets: completedSetsCount,
        completedPrograms: completedProgramsCount
      }
    });
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
//... (existing code)
}

/**
 * Update user profile and basic info
 */
async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { email, profile } = req.body;

    const user = await User.findByPk(id, {
      include: [{ model: UserProfile, as: 'profile' }]
    });

    if (!user) {
      return res.status(404).json({ error: { message: 'Foydalanuvchi topilmadi' } });
    }

    // Update email if provided
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser && existingUser.id !== parseInt(id)) {
        return res.status(400).json({ error: { message: 'Ushbu email allaqachon ro\'yxatdan o\'tgan' } });
      }
      user.email = email;
      await user.save();
    }

    // Update profile if provided
    if (profile) {
      const allowedProfileFields = [
        'firstName', 'lastName', 'phone', 'gender', 
        'age', 'height', 'weight', 'fitnessGoal', 'workoutFrequency'
      ];
      
      const filteredProfile = {};
      allowedProfileFields.forEach(field => {
        if (profile[field] !== undefined) {
          filteredProfile[field] = profile[field];
        }
      });

      if (user.profile) {
        await user.profile.update(filteredProfile);
      } else {
        await UserProfile.create({ ...filteredProfile, userId: id });
      }
    }

    res.json({ message: 'Ma\'lumotlar muvaffaqiyatli yangilandi' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllUsers,
  getUserDetails,
  getGlobalStats,
  deleteUser,
  updateUser
};
