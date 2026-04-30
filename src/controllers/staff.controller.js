'use strict';

const { User, UserProfile, Role, Permission, sequelize } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const { ValidationError, ConflictError } = require('../utils/errors');

/**
 * GET /admin/staff
 * List all staff members (excluding regular users)
 */
async function getStaffList(req, res, next) {
  try {
    const staff = await User.findAll({
      include: [
        { 
          model: Role, 
          as: 'role',
          where: {
            name: { [Op.ne]: 'user' }
          }
        },
        { model: UserProfile, as: 'profile' },
        { model: Permission, as: 'userPermissions' }
      ],
      order: [['createdAt', 'DESC']]
    });

    const formattedStaff = staff.map(s => ({
      id: s.id,
      email: s.email,
      role: s.role?.name,
      roleId: s.roleId,
      name: s.profile?.name,
      phone: s.profile?.phone,
      permissions: s.userPermissions?.map(p => p.id) || [],
      createdAt: s.createdAt
    }));

    res.json(formattedStaff);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /admin/staff
 * Create a new staff member
 */
async function createStaff(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const { name, email, password, roleId, phone, permissionIds } = req.body;

    // Validate email
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictError('Foydalanuvchi ushbu email bilan allaqachon mavjud');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create User
    const user = await User.create({
      email,
      passwordHash,
      roleId
    }, { transaction: t });

    // Create Profile
    await UserProfile.create({
      userId: user.id,
      name,
      phone
    }, { transaction: t });

    // Assign Permissions
    if (permissionIds && permissionIds.length > 0) {
      await user.setUserPermissions(permissionIds, { transaction: t });
    }

    await t.commit();
    res.status(201).json({ message: 'Staff a\'zosi muvaffaqiyatli yaratildi', userId: user.id });
  } catch (err) {
    await t.rollback();
    next(err);
  }
}

/**
 * PUT /admin/staff/:id
 * Update staff member
 */
async function updateStaff(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { name, email, password, roleId, phone, permissionIds } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      throw new ValidationError('Staff a\'zosi topilmadi');
    }

    // Update User
    const userUpdate = { email, roleId };
    if (password) {
      userUpdate.passwordHash = await bcrypt.hash(password, 10);
    }
    await user.update(userUpdate, { transaction: t });

    // Update Profile
    await UserProfile.upsert({
      userId: user.id,
      name,
      phone
    }, { transaction: t });

    // Update Permissions
    if (permissionIds) {
      await user.setUserPermissions(permissionIds, { transaction: t });
    }

    await t.commit();
    res.json({ message: 'Staff a\'zosi muvaffaqiyatli yangilandi' });
  } catch (err) {
    await t.rollback();
    next(err);
  }
}

/**
 * DELETE /admin/staff/:id
 */
async function deleteStaff(req, res, next) {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
        include: [{ model: Role, as: 'role' }]
    });

    if (!user) throw new ValidationError('Foydalanuvchi topilmadi');
    if (user.role?.name === 'superadmin') {
        throw new ValidationError('Superadminni o\'chirib bo\'lmaydi');
    }

    await user.destroy();
    res.json({ message: 'Staff a\'zosi o\'chirildi' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStaffList,
  createStaff,
  updateStaff,
  deleteStaff
};
