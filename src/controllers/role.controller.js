'use strict';

const roleService = require('../services/role.service');

async function getRoles(req, res, next) {
  try {
    const roles = await roleService.getAllRoles();
    res.json(roles);
  } catch (err) {
    next(err);
  }
}

async function getPermissions(req, res, next) {
  try {
    const permissions = await roleService.getAllPermissions();
    res.json(permissions);
  } catch (err) {
    next(err);
  }
}

async function createRole(req, res, next) {
  try {
    const role = await roleService.createRole(req.body);
    res.status(201).json(role);
  } catch (err) {
    next(err);
  }
}

async function updateRole(req, res, next) {
  try {
    const role = await roleService.updateRole(req.params.id, req.body);
    res.json(role);
  } catch (err) {
    next(err);
  }
}

async function deleteRole(req, res, next) {
  try {
    const result = await roleService.deleteRole(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function assignRole(req, res, next) {
  try {
    const { userId, roleId } = req.body;
    const user = await roleService.assignRoleToUser(userId, roleId);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getRoles,
  getPermissions,
  createRole,
  updateRole,
  deleteRole,
  assignRole
};
