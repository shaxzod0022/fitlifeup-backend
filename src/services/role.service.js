'use strict';

const { Role, Permission, User } = require('../models');
const { NotFoundError, BadRequestError } = require('../utils/errors');

/**
 * Get all roles with their permissions.
 */
async function getAllRoles() {
  return await Role.findAll({
    include: [{ model: Permission, as: 'permissions' }]
  });
}

/**
 * Get all available permissions.
 */
async function getAllPermissions() {
  return await Permission.findAll();
}

/**
 * Create a new role.
 */
async function createRole(data) {
  const { name, description, permissionIds } = data;
  
  const existing = await Role.findOne({ where: { name } });
  if (existing) {
    throw new BadRequestError(`Role with name '${name}' already exists`);
  }

  const role = await Role.create({ name, description });

  if (permissionIds && permissionIds.length > 0) {
    await role.setPermissions(permissionIds);
  }

  return await Role.findByPk(role.id, {
    include: [{ model: Permission, as: 'permissions' }]
  });
}

/**
 * Update an existing role.
 */
async function updateRole(id, data) {
  const { name, description, permissionIds } = data;
  
  const role = await Role.findByPk(id);
  if (!role) {
    throw new NotFoundError('Role not found');
  }

  if (role.name === 'superadmin') {
    throw new BadRequestError('Cannot modify superadmin role');
  }

  await role.update({ name, description });

  if (permissionIds) {
    await role.setPermissions(permissionIds);
  }

  return await Role.findByPk(id, {
    include: [{ model: Permission, as: 'permissions' }]
  });
}

/**
 * Delete a role.
 */
async function deleteRole(id) {
  const role = await Role.findByPk(id);
  if (!role) {
    throw new NotFoundError('Role not found');
  }

  if (role.name === 'superadmin' || role.name === 'user') {
    throw new BadRequestError('Cannot delete system roles');
  }

  // Check if users are assigned to this role
  const userCount = await User.count({ where: { roleId: id } });
  if (userCount > 0) {
    throw new BadRequestError('Cannot delete role that has assigned users');
  }

  await role.destroy();
  return { message: 'Role deleted successfully' };
}

/**
 * Assign a role to a user.
 */
async function assignRoleToUser(userId, roleId) {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const role = await Role.findByPk(roleId);
  if (!role) {
    throw new NotFoundError('Role not found');
  }

  user.roleId = roleId;
  await user.save();

  return user;
}

module.exports = {
  getAllRoles,
  getAllPermissions,
  createRole,
  updateRole,
  deleteRole,
  assignRoleToUser
};
