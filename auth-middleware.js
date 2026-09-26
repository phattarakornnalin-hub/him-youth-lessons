// Authentication & Authorization Middleware (hardened)
// - bcryptjs for password hashing
// - jsonwebtoken for proper JWT
// - Secrets loaded from environment only

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const USERS_FILE = path.join(__dirname, 'users.json');
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = 12;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error(
    'FATAL: JWT_SECRET is missing or too short. Set a strong secret (≥32 chars) in .env'
  );
  process.exit(1);
}

// Load users from file
function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading users:', err.message);
  }
  return [];
}

// Save users to file (atomic write)
function saveUsers(users) {
  try {
    const tmp = USERS_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(users, null, 2), { mode: 0o600 });
    fs.renameSync(tmp, USERS_FILE);
  } catch (err) {
    console.error('Error saving users:', err.message);
    throw err;
  }
}

// Hash password with bcrypt
function hashPassword(password) {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS);
}

// Compare password (bcrypt only — old SHA-256 hashes are rejected)
function comparePassword(password, hash) {
  if (!hash || typeof hash !== 'string') return false;

  // bcrypt hashes start with $2a$, $2b$ or $2y$
  if (hash.startsWith('$2')) {
    return bcrypt.compareSync(password, hash);
  }

  // Legacy SHA-256 hashes are no longer accepted. Re-create accounts or reset passwords.
  return false;
}

// Generate proper JWT
function generateToken(userId, username, role) {
  return jwt.sign(
    { userId, username, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN, algorithm: 'HS256' }
  );
}

// Verify JWT
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
  } catch (err) {
    return null;
  }
}

// Middleware: Verify token and attach user to request
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
}

// Middleware: Check if user has required role
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

// Middleware: Check if user owns the lesson or is admin
function checkLessonOwnership(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role === 'admin') {
    req.isOwner = true;
    return next();
  }

  next();
}

module.exports = {
  loadUsers,
  saveUsers,
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  authenticateToken,
  requireRole,
  checkLessonOwnership,
};