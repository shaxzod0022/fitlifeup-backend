'use strict';

// Load environment variables from .env file
require('dotenv').config();

const app = require('./app');
const { validateEnvironment } = require('./config/env');

// Validate environment variables on startup
// Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5
try {
  validateEnvironment();
} catch (error) {
  console.error('Failed to start application:', error.message);
  process.exit(1);
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
