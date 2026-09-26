// HIM Youth Thailand — Lesson Management Server (hardened)
// Express backend with proper JWT + bcrypt, rate limiting, security headers,
// restricted static serving, and safer file handling.

require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const auth = require('./auth-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Security middleware ----------
app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // needed for inline scripts in current HTML
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        frameSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false, // allow PDF embedding if needed
  })
);

// CORS — restrict to configured origins (or same-origin only)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (same-origin, curl, mobile apps, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0) {
        // No origins configured → allow only same-origin style (no cross-origin)
        return callback(null, false);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later' },
});

app.use(generalLimiter);

// Body parsing with reasonable limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// ---------- Block sensitive files from static serving ----------
const BLOCKED_PATHS = [
  /^\/server\.js$/i,
  /^\/auth-middleware\.js$/i,
  /^\/users\.json$/i,
  /^\/package\.json$/i,
  /^\/package-lock\.json$/i,
  /^\/\.env/i,
  /^\/node_modules/i,
  /^\/\.git/i,
];

app.use((req, res, next) => {
  if (BLOCKED_PATHS.some((re) => re.test(req.path))) {
    return res.status(404).end();
  }
  next();
});

// Static files — only public assets + lessons
app.use(express.static(path.join(__dirname), {
  index: false,
  dotfiles: 'deny',
  setHeaders: (res, filePath) => {
    // Extra protection: never serve .js that are server-side, .json secrets, etc.
    const base = path.basename(filePath).toLowerCase();
    if (
      base === 'server.js' ||
      base === 'auth-middleware.js' ||
      base === 'users.json' ||
      base.startsWith('.env')
    ) {
      res.status(404).end();
    }
  },
}));

// Explicitly serve lessons (PDFs + markdown) under /lessons
app.use('/lessons', express.static(path.join(__dirname, 'lessons'), {
  dotfiles: 'deny',
  index: false,
}));

// ---------- Multer (uploads) ----------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'text/x-markdown',
    ];
    const ext = path.extname(file.originalname || '').toLowerCase();
    const allowedExt = ['.pdf', '.md', '.txt', '.markdown'];

    if (allowedMimes.includes(file.mimetype) && allowedExt.includes(ext)) {
      return cb(null, true);
    }
    // Reject octet-stream and unknown types
    cb(new Error('Only PDF (.pdf) or Markdown/Text (.md, .txt) files are allowed'));
  },
});

// ---------- Paths ----------
const LESSONS_DIR = path.join(__dirname, 'lessons');
const PDFS_DIR = path.join(LESSONS_DIR, 'pdfs');
const MANIFEST_FILE = path.join(LESSONS_DIR, 'manifest.json');

// Ensure directories exist
if (!fs.existsSync(LESSONS_DIR)) fs.mkdirSync(LESSONS_DIR, { recursive: true });
if (!fs.existsSync(PDFS_DIR)) fs.mkdirSync(PDFS_DIR, { recursive: true });

// ---------- Helpers ----------
function loadManifest() {
  try {
    if (fs.existsSync(MANIFEST_FILE)) {
      const data = fs.readFileSync(MANIFEST_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading manifest:', err.message);
  }
  return [];
}

function saveManifest(lessons) {
  const tmp = MANIFEST_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(lessons, null, 2));
  fs.renameSync(tmp, MANIFEST_FILE);
  console.log('✅ Manifest saved');
}

function generateNextID(lessons) {
  if (lessons.length === 0) return '0001';
  const maxID = Math.max(
    ...lessons.map((l) => {
      const match = String(l.id || '').match(/^(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })
  );
  return String(maxID + 1).padStart(4, '0');
}

function isPdfUpload(file) {
  if (!file) return false;
  const ext = path.extname(file.originalname || '').toLowerCase();
  return file.mimetype === 'application/pdf' || ext === '.pdf';
}

function extractLessonFields(req) {
  let content = null;
  let isPdf = false;
  let fileBuffer = null;

  if (req.file && req.file.buffer) {
    fileBuffer = req.file.buffer;
    isPdf = isPdfUpload(req.file);
    if (!isPdf) {
      content = req.file.buffer.toString('utf-8');
    }
  } else if (req.body && req.body.content !== undefined) {
    content = req.body.content;
  }

  return {
    title: (req.body.title || '').trim().slice(0, 200),
    category: (req.body.category || '').trim().slice(0, 100),
    date: (req.body.date || '').trim().slice(0, 30),
    excerpt: (req.body.excerpt || '').trim().slice(0, 500),
    content,
    isPdf,
    fileBuffer,
    originalName: req.file ? req.file.originalname : null,
  };
}

// Safe path check — prevent path traversal
function safeLessonPath(relativeFile) {
  const resolved = path.resolve(LESSONS_DIR, relativeFile);
  if (!resolved.startsWith(LESSONS_DIR + path.sep) && resolved !== LESSONS_DIR) {
    throw new Error('Invalid file path');
  }
  return resolved;
}

// ---------- PUBLIC ROUTES ----------
app.get('/api/lessons', (req, res) => {
  try {
    const lessons = loadManifest();
    // Return public fields only
    const publicLessons = lessons.map((l) => ({
      id: l.id,
      title: l.title,
      category: l.category,
      date: l.date,
      excerpt: l.excerpt,
      type: l.type || (l.file && l.file.endsWith('.pdf') ? 'pdf' : 'markdown'),
      file: l.file,
    }));
    res.json(publicLessons);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load lessons' });
  }
});

app.get('/api/lessons/:id', (req, res) => {
  try {
    const id = String(req.params.id || '').replace(/[^a-zA-Z0-9_-]/g, '');
    if (!id) return res.status(400).json({ error: 'Invalid id' });

    const lessons = loadManifest();
    const lesson = lessons.find((l) => l.id === id);

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const isPdf =
      lesson.type === 'pdf' ||
      (lesson.file && lesson.file.toLowerCase().endsWith('.pdf'));

    const result = {
      id: lesson.id,
      title: lesson.title,
      category: lesson.category,
      date: lesson.date,
      excerpt: lesson.excerpt,
      type: isPdf ? 'pdf' : 'markdown',
      file: lesson.file,
    };

    if (!isPdf) {
      const filePath = safeLessonPath(lesson.file);
      if (fs.existsSync(filePath)) {
        result.content = fs.readFileSync(filePath, 'utf-8');
      }
    } else {
      result.contentUrl = '/lessons/' + lesson.file;
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load lesson' });
  }
});

// ---------- AUTH ROUTES ----------
app.post('/api/auth/login', loginLimiter, (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Username and password required' });
    }

    if (username.length > 64 || password.length > 128) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const users = auth.loadUsers();
    const user = users.find((u) => u.username === username.trim());

    if (!user || !auth.comparePassword(password, user.password)) {
      // Generic message — do not reveal whether username exists
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Optional: upgrade legacy hash on successful login is no longer needed
    // (legacy hashes are rejected)

    const token = auth.generateToken(user.id, user.username, user.role);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/logout', auth.authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

app.get('/api/auth/me', auth.authenticateToken, (req, res) => {
  const users = auth.loadUsers();
  const user = users.find((u) => u.id === req.user.userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    email: user.email,
  });
});

// ---------- LESSON MANAGEMENT (protected) ----------
app.post(
  '/api/lessons',
  auth.authenticateToken,
  auth.requireRole('writer', 'admin'),
  (req, res, next) => {
    const ct = req.headers['content-type'] || '';
    if (ct.includes('multipart/form-data')) {
      return upload.single('contentFile')(req, res, (err) => {
        if (err) {
          return res.status(400).json({ error: err.message || 'Upload failed' });
        }
        next();
      });
    }
    next();
  },
  (req, res) => {
    try {
      const { title, category, date, excerpt, content, isPdf, fileBuffer, originalName } =
        extractLessonFields(req);

      const hasContent = isPdf ? !!fileBuffer : !!content;
      if (!title || !category || !date || !excerpt || !hasContent) {
        return res.status(400).json({
          error:
            'Missing required fields (title, category, date, excerpt, and contentFile). Upload a PDF or Markdown file.',
        });
      }

      const lessons = loadManifest();
      const id = generateNextID(lessons);

      let file;
      let type;
      if (isPdf) {
        type = 'pdf';
        file = `pdfs/${id}.pdf`;
        const filePath = safeLessonPath(file);
        fs.writeFileSync(filePath, fileBuffer);
        console.log(`📄 Saved PDF: ${file} (from ${originalName})`);
      } else {
        type = 'markdown';
        file = `${id}.md`;
        const filePath = safeLessonPath(file);
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`📝 Saved: ${file}${originalName ? ' (from ' + originalName + ')' : ''}`);
      }

      const newLesson = {
        id,
        title,
        category,
        date,
        excerpt,
        type,
        file,
        userId: req.user.userId,
        createdBy: req.user.username,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      lessons.push(newLesson);
      saveManifest(lessons);

      res.status(201).json(newLesson);
    } catch (err) {
      console.error('Error creating lesson:', err.message);
      res.status(500).json({ error: 'Failed to create lesson' });
    }
  }
);

app.put(
  '/api/lessons/:id',
  auth.authenticateToken,
  auth.requireRole('writer', 'admin'),
  (req, res, next) => {
    const ct = req.headers['content-type'] || '';
    if (ct.includes('multipart/form-data')) {
      return upload.single('contentFile')(req, res, (err) => {
        if (err) {
          return res.status(400).json({ error: err.message || 'Upload failed' });
        }
        next();
      });
    }
    next();
  },
  (req, res) => {
    try {
      const id = String(req.params.id || '').replace(/[^a-zA-Z0-9_-]/g, '');
      if (!id) return res.status(400).json({ error: 'Invalid id' });

      const lessons = loadManifest();
      const lessonIndex = lessons.findIndex((l) => l.id === id);

      if (lessonIndex === -1) {
        return res.status(404).json({ error: 'Lesson not found' });
      }

      const lesson = lessons[lessonIndex];

      // Ownership check
      if (req.user.role !== 'admin' && lesson.userId !== req.user.userId) {
        return res.status(403).json({ error: 'You can only edit your own lessons' });
      }

      const { title, category, date, excerpt, content, isPdf, fileBuffer, originalName } =
        extractLessonFields(req);

      if (title) lesson.title = title;
      if (category) lesson.category = category;
      if (date) lesson.date = date;
      if (excerpt) lesson.excerpt = excerpt;
      lesson.updatedAt = new Date().toISOString();
      lesson.updatedBy = req.user.username;

      if (fileBuffer) {
        const oldPath = safeLessonPath(lesson.file);
        if (isPdf) {
          lesson.type = 'pdf';
          lesson.file = `pdfs/${lesson.id}.pdf`;
          const newPath = safeLessonPath(lesson.file);
          fs.writeFileSync(newPath, fileBuffer);
          if (oldPath !== newPath && fs.existsSync(oldPath)) {
            try { fs.unlinkSync(oldPath); } catch (_) {}
          }
          console.log(`📄 Updated PDF: ${lesson.file} (from ${originalName})`);
        } else {
          lesson.type = 'markdown';
          lesson.file = `${lesson.id}.md`;
          const newPath = safeLessonPath(lesson.file);
          fs.writeFileSync(newPath, content, 'utf-8');
          if (oldPath !== newPath && fs.existsSync(oldPath)) {
            try { fs.unlinkSync(oldPath); } catch (_) {}
          }
          console.log(`✏️ Updated: ${lesson.file} (from ${originalName})`);
        }
      } else if (content !== null && content !== undefined) {
        const filePath = safeLessonPath(lesson.file);
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`✏️ Updated: ${lesson.file}`);
      }

      lessons[lessonIndex] = lesson;
      saveManifest(lessons);

      res.json(lesson);
    } catch (err) {
      console.error('Error updating lesson:', err.message);
      res.status(500).json({ error: 'Failed to update lesson' });
    }
  }
);

app.delete('/api/lessons/:id', auth.authenticateToken, (req, res) => {
  try {
    const id = String(req.params.id || '').replace(/[^a-zA-Z0-9_-]/g, '');
    if (!id) return res.status(400).json({ error: 'Invalid id' });

    const lessons = loadManifest();
    const lesson = lessons.find((l) => l.id === id);

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    if (req.user.role !== 'admin' && lesson.userId !== req.user.userId) {
      return res.status(403).json({ error: 'You can only delete your own lessons' });
    }

    const filePath = safeLessonPath(lesson.file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Deleted: ${lesson.file}`);
    }

    const filteredLessons = lessons.filter((l) => l.id !== id);
    saveManifest(filteredLessons);

    res.json({ message: 'Lesson deleted' });
  } catch (err) {
    console.error('Error deleting lesson:', err.message);
    res.status(500).json({ error: 'Failed to delete lesson' });
  }
});

// ---------- ADMIN ROUTES ----------
app.get('/api/admin/lessons', auth.authenticateToken, auth.requireRole('admin'), (req, res) => {
  try {
    const lessons = loadManifest();
    res.json(lessons);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load lessons' });
  }
});

app.get('/api/admin/users', auth.authenticateToken, auth.requireRole('admin'), (req, res) => {
  try {
    const users = auth.loadUsers();
    const safeUsers = users.map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      email: u.email,
      createdAt: u.createdAt,
    }));
    res.json(safeUsers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load users' });
  }
});

app.post('/api/admin/users', auth.authenticateToken, auth.requireRole('admin'), (req, res) => {
  try {
    const { username, password, email } = req.body || {};

    if (!username || !password || !email) {
      return res.status(400).json({ error: 'Username, password, and email required' });
    }

    if (typeof username !== 'string' || username.length < 3 || username.length > 32) {
      return res.status(400).json({ error: 'Username must be 3–32 characters' });
    }
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return res.status(400).json({ error: 'Password must be 8–128 characters' });
    }
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    const users = auth.loadUsers();

    if (users.some((u) => u.username === username.trim())) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const newUser = {
      id: `writer_${Date.now()}`,
      username: username.trim(),
      password: auth.hashPassword(password),
      role: 'writer',
      email: email.trim().toLowerCase(),
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    auth.saveUsers(users);

    res.status(201).json({
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
      email: newUser.email,
      createdAt: newUser.createdAt,
    });
  } catch (err) {
    console.error('Error creating user:', err.message);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.put('/api/admin/users/:userId', auth.authenticateToken, auth.requireRole('admin'), (req, res) => {
  try {
    const { email, password } = req.body || {};
    const users = auth.loadUsers();
    const userIndex = users.findIndex((u) => u.id === req.params.userId);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (email) {
      if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Valid email required' });
      }
      users[userIndex].email = email.trim().toLowerCase();
    }
    if (password) {
      if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
        return res.status(400).json({ error: 'Password must be 8–128 characters' });
      }
      users[userIndex].password = auth.hashPassword(password);
    }

    auth.saveUsers(users);

    res.json({
      id: users[userIndex].id,
      username: users[userIndex].username,
      role: users[userIndex].role,
      email: users[userIndex].email,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/admin/users/:userId', auth.authenticateToken, auth.requireRole('admin'), (req, res) => {
  try {
    const users = auth.loadUsers();
    const user = users.find((u) => u.id === req.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin' && users.filter((u) => u.role === 'admin').length === 1) {
      return res.status(400).json({ error: 'Cannot delete the last admin' });
    }

    const filteredUsers = users.filter((u) => u.id !== req.params.userId);
    auth.saveUsers(filteredUsers);

    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ---------- Fallback & error handling ----------
app.use((err, req, res, next) => {
  if (err && err.message && err.message.includes('CORS')) {
    return res.status(403).json({ error: 'Not allowed by CORS' });
  }
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  console.error('Unhandled error:', err.message || err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 HIM Youth Lessons Server (hardened) running on http://localhost:${PORT}`);
  console.log(`🔐 Login: http://localhost:${PORT}/login.html`);
  console.log(`👨‍💼 Admin Panel: http://localhost:${PORT}/admin.html`);
  console.log(`📚 Public Lessons: http://localhost:${PORT}/index.html`);
  console.log(`\n📁 Lessons stored in: ${LESSONS_DIR}\n`);
});
