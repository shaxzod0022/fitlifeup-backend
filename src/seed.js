'use strict';

require('dotenv').config();
const { Role, Permission, User, sequelize } = require('./models');
const bcrypt = require('bcrypt');

const permissions = [
  // Foydalanuvchilarni boshqarish
  { slug: 'view_users', name: 'Foydalanuvchilarni ko\'rish', category: 'Foydalanuvchilar' },
  { slug: 'manage_users', name: 'Foydalanuvchilarni boshqarish (Yaratish/Tahrirlash/O\'chirish)', category: 'Foydalanuvchilar' },
  
  // Rollarni boshqarish
  { slug: 'view_roles', name: 'Rollarni ko\'rish', category: 'Rollar' },
  { slug: 'manage_roles', name: 'Rollarni va ruxsatnomalarni boshqarish', category: 'Rollar' },
  
  // Kontentni boshqarish
  { slug: 'manage_exercises', name: 'Mashqlarni boshqarish', category: 'Kontent' },
  { slug: 'manage_programs', name: 'Dasturlarni boshqarish', category: 'Kontent' },
  { slug: 'manage_sets', name: 'Mashq to\'plamlarini boshqarish', category: 'Kontent' },
  { slug: 'manage_dishes', name: 'Taomlarni boshqarish', category: 'Kontent' },
  
  // Moliyaviy/Hisob-kitob
  { slug: 'view_accounting', name: 'Hisob-kitob va hisobotlarni ko\'rish', category: 'Moliya' },
];

async function seed() {
  try {
    console.log('Seeding roles and permissions...');
    
    // Sync database
    await sequelize.sync();
    
    // Create Permissions
    for (const p of permissions) {
      await Permission.findOrCreate({
        where: { slug: p.slug },
        defaults: p
      });
    }
    console.log('Permissions seeded.');

    // Create Super Admin Role
    const [superadminRole] = await Role.findOrCreate({
      where: { name: 'superadmin' },
      defaults: { description: 'Tizimning barcha qismlariga to\'liq kirish huquqi' }
    });
    
    // Assign all permissions to Super Admin
    const allPermissions = await Permission.findAll();
    await superadminRole.setPermissions(allPermissions);
    console.log('Super Admin role created and permissions assigned.');

    // Create a regular User Role
    await Role.findOrCreate({
      where: { name: 'user' },
      defaults: { description: 'Oddiy mobil ilova foydalanuvchisi' }
    });
    console.log('User role created.');

    // Create an Accountant (Bugalter) Role
    const [accountantRole] = await Role.findOrCreate({
      where: { name: 'accountant' },
      defaults: { description: 'Faqat hisob-kitob va moliya bo\'limiga kirish huquqi' }
    });
    const accountingPerm = await Permission.findOne({ where: { slug: 'view_accounting' } });
    await accountantRole.setPermissions([accountingPerm]);
    console.log('Accountant role created.');

    // Create default Super Admin user if none exists
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@fitlifeup.com';
    const existingAdmin = await User.findOne({ where: { email: superAdminEmail } });
    
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      await User.create({
        email: superAdminEmail,
        passwordHash,
        roleId: superadminRole.id
      });
      console.log(`Default Super Admin created: ${superAdminEmail} / admin123`);
    } else {
      // Update existing admin to have superadmin role
      existingAdmin.roleId = superadminRole.id;
      await existingAdmin.save();
      console.log('Existing admin updated to superadmin role.');
    }

    console.log('Seeding completed successfully.');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    process.exit();
  }
}

seed();
