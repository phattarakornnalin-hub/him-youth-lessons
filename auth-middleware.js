// Authentication & Authorization Middleware
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const USERS_FILE = path.join(__dirname, 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'him-youth-lessons-secret-key-change-in-production';

// Load users from file
function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading users:', err);
  }
  return [];
}

// Save users to file
function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Error saving users:', err);
    throw err;
  }
}

// Simple JWT implementation (for production, use jsonwebtoken package)
function generateToken(userId, username, role) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({
    userId,
    username,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  })).toString('base64');
  
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64');
  
  return `${header}.${payload}.${signature}`;
}

// Verify JWT token
function verifyToken(token) {
  try {
    const [header, payload, signature] = token.split('.');
    
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64');
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
    
    // Check expiration
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return decoded;
  } catch (err) {
    return null;
  }
}

// Hash password (simple bcrypt-like hashing for demo)
function hashPassword(password) {
  // For production, use bcrypt package
  return crypto.createHash('sha256').update(password + JWT_SECRET).digest('hex');
}

// Compare password
function comparePassword(password, hash) {
  return hashPassword(password) === hash;
}

// Middleware: Verify token and attach user to request
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' });
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

  // Admin can access everything
  if (req.user.role === 'admin') {
    req.isOwner = true;
    return next();
  }

  // Get lesson and check if user created it
  const users = loadUsers();
  const user = users.find(u => u.id === req.user.userId);
  
  // For now, we'll check this in the route handler
  // This allows for more flexible permission checking
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
  checkLessonOwnership
};
