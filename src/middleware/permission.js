'use strict';

const { User, Role, Permission } = require('../models');
const { UnauthorizedError } = require('../utils/errors');

/**
 * Middleware to check if the user has a specific permission.
 * @param {string} permissionSlug - The slug of the permission to check (e.g., 'manage_users').
 */
function checkPermission(permissionSlug) {
  return async (req, res, next) => {
    try {
      if (!req.userId) {
        return next(new UnauthorizedError('Authentication required'));
      }

      // If permissions already in request (from authMiddleware), use them
      let permissions = req.userPermissions || [];
      let roleName = req.userRole;

      // If not in request (e.g. manually attached or fresh), fetch from DB
      if (permissions.length === 0 && !roleName) {
        const user = await User.findByPk(req.userId, {
          include: [
            {
              model: Role,
              as: 'role',
              include: [{ model: Permission, as: 'permissions' }],
            },
          ],
        });

        if (!user || !user.role) {
          return next(new UnauthorizedError('User has no assigned role'));
        }

        roleName = user.role.name;
        permissions = user.role.permissions.map(p => p.slug);
      }

      // Super Admin bypass: role name is 'superadmin'
      if (roleName === 'superadmin') {
        return next();
      }

      const hasPermission = permissions.includes(permissionSlug);

      if (!hasPermission) {
        return next(new UnauthorizedError(`Access denied: Required permission '${permissionSlug}' missing`));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = checkPermission;
