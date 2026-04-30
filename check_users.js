const { User } = require('./src/models');
const sequelize = require('./src/config/database');

async function checkUsers() {
  try {
    const users = await User.findAll();
    console.log('Users in DB:');
    users.forEach(u => {
      console.log(`ID: ${u.id}, Email: '${u.email}', Hash: ${u.passwordHash}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkUsers();
