/**
 * One-time helper: re-create / reset the admin user with a proper bcrypt hash.
 *
 * Usage:
 *   node scripts/reset-admin-password.js <new-password>
 *
 * Example:
 *   node scripts/reset-admin-password.js "MyStrongP@ssw0rd!"
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const USERS_FILE = path.join(__dirname, '..', 'users.json');
const password = process.argv[2];

if (!password || password.length < 8) {
  console.error('Usage: node scripts/reset-admin-password.js <password-at-least-8-chars>');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);

let users = [];
if (fs.existsSync(USERS_FILE)) {
  users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

const adminIndex = users.findIndex((u) => u.role === 'admin' || u.username === 'admin');
if (adminIndex >= 0) {
  users[adminIndex].password = hash;
  console.log('Updated existing admin password.');
} else {
  users.unshift({
    id: 'admin_' + Date.now(),
    username: 'admin',
    password: hash,
    role: 'admin',
    email: 'admin@himyouth.com',
    createdAt: new Date().toISOString(),
  });
  console.log('Created new admin user.');
}

fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), { mode: 0o600 });
console.log('users.json written. You can now log in with username "admin" and the new password.');
