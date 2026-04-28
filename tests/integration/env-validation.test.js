'use strict';

/**
 * Integration test for environment validation on application startup
 * Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5
 */

const { spawn } = require('child_process');
const path = require('path');

describe('Application Startup Environment Validation', () => {
  const indexPath = path.join(__dirname, '../../src/index.js');

  test('should fail to start when JWT_SECRET is missing', (done) => {
    // Create a minimal test script that doesn't load .env
    const testScript = `
      const { validateEnvironment } = require('${path.join(__dirname, '../../src/config/env.js').replace(/\\/g, '\\\\')}');
      try {
        validateEnvironment();
        console.log('VALIDATION_PASSED');
        process.exit(0);
      } catch (error) {
        console.error('Failed to start application:', error.message);
        process.exit(1);
      }
    `;

    const env = { ...process.env };
    delete env.JWT_SECRET;

    const child = spawn('node', ['-e', testScript], { env });
    let stderr = '';
    let stdout = '';

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    const timeout = setTimeout(() => {
      child.kill();
      done(new Error('Process did not exit in time. stdout: ' + stdout + ', stderr: ' + stderr));
    }, 2000);

    child.on('close', (code) => {
      clearTimeout(timeout);
      expect(code).toBe(1);
      const output = stderr + stdout;
      expect(output).toContain('Missing required environment variables: JWT_SECRET');
      done();
    });
  }, 5000);

  test('should start successfully when JWT_SECRET is provided', (done) => {
    const env = {
      ...process.env,
      JWT_SECRET: 'test-secret-key-at-least-32-characters-long',
      PORT: '0' // Use port 0 to let the OS assign a random available port
    };

    const child = spawn('node', [indexPath], { env });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
      // Kill the process once we see the server started message
      if (stdout.includes('Сервер запущен на порту')) {
        child.kill();
        clearTimeout(timeout);
        done();
      }
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    const timeout = setTimeout(() => {
      child.kill();
      done(new Error('Server did not start in time. stdout: ' + stdout + ', stderr: ' + stderr));
    }, 2000);

    child.on('close', (code) => {
      clearTimeout(timeout);
      // If the process exited before we killed it, that's an error
      if (code !== null && code !== 0) {
        done(new Error('Server exited with code ' + code + '. stderr: ' + stderr));
      }
    });
  }, 5000);

  test('should fail to start when BCRYPT_SALT_ROUNDS is invalid', (done) => {
    // Create a minimal test script that doesn't load .env
    const testScript = `
      process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long';
      process.env.BCRYPT_SALT_ROUNDS = '5';
      const { validateEnvironment } = require('${path.join(__dirname, '../../src/config/env.js').replace(/\\/g, '\\\\')}');
      try {
        validateEnvironment();
        console.log('VALIDATION_PASSED');
        process.exit(0);
      } catch (error) {
        console.error('Failed to start application:', error.message);
        process.exit(1);
      }
    `;

    const env = { ...process.env };
    delete env.JWT_SECRET;
    delete env.BCRYPT_SALT_ROUNDS;

    const child = spawn('node', ['-e', testScript], { env });
    let stderr = '';
    let stdout = '';

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    const timeout = setTimeout(() => {
      child.kill();
      done(new Error('Process did not exit in time'));
    }, 2000);

    child.on('close', (code) => {
      clearTimeout(timeout);
      expect(code).toBe(1);
      const output = stderr + stdout;
      expect(output).toContain('BCRYPT_SALT_ROUNDS must be a number >= 10');
      done();
    });
  }, 5000);
});
