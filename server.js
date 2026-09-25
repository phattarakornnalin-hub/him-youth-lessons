// HIM Youth Thailand — Lesson Management Server with Role-Based Access Control
// Express backend with JWT authentication for Create/Read/Update/Delete lessons
// Saves directly to lessons/ folder for instant updates on index.html

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');
const multer = require('multer');
const auth = require('./auth-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Multer: store uploaded lesson files in memory (PDF or Markdown)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB for PDFs
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'text/x-markdown',
      'application/octet-stream',
    ];
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (allowedMimes.includes(file.mimetype) || ['.pdf', '.md', '.txt', '.markdown'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF (.pdf) or Markdown/Text (.md, .txt) files are allowed'));
    }
  },
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('.'));

const LESSONS_DIR = path.join(__dirname, 'lessons');
const PDFS_DIR = path.join(LESSONS_DIR, 'pdfs');
const MANIFEST_FILE = path.join(LESSONS_DIR, 'manifest.json');
const USERS_FILE = path.join(__dirname, 'users.json');

// Ensure directories exist
if (!fs.existsSync(LESSONS_DIR)) {
  fs.mkdirSync(LESSONS_DIR, { recursive: true });
}
if (!fs.existsSync(PDFS_DIR)) {
  fs.mkdirSync(PDFS_DIR, { recursive: true });
}

// Load manifest from file
function loadManifest() {
  try {
    if (fs.existsSync(MANIFEST_FILE)) {
      const data = fs.readFileSync(MANIFEST_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading manifest:', err);
  }
  return [];
}

// Save manifest to file
function saveManifest(lessons) {
  try {
    fs.writeFileSync(MANIFEST_FILE, JSON.stringify(lessons, null, 2));
    console.log('✅ Manifest saved');
  } catch (err) {
    console.error('Error saving manifest:', err);
    throw err;
  }
}

// Helper function to generate next sequential ID
function generateNextID(lessons) {
  if (lessons.length === 0) return '0001';
  
  const maxID = Math.max(
    ...lessons.map((l) => {
      const match = l.id.match(/^(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })
  );
  
  return String(maxID + 1).padStart(4, '0');
}

// ============ PUBLIC ROUTES ============

// GET all lessons (public - for viewers)
app.get('/api/lessons', (req, res) => {
  try {
    const lessons = loadManifest();
    // Return only published lessons for public view
    res.json(lessons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single lesson with content (public)
app.get('/api/lessons/:id', (req, res) => {
  try {
    const lessons = loadManifest();
    const lesson = lessons.find((l) => l.id === req.params.id);
    
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Read text content only for markdown lessons (PDFs are served as static files)
    const isPdf =
      lesson.type === 'pdf' ||
      (lesson.file && lesson.file.toLowerCase().endsWith('.pdf'));
    if (!isPdf) {
      const filePath = path.join(LESSONS_DIR, lesson.file);
      if (fs.existsSync(filePath)) {
        lesson.content = fs.readFileSync(filePath, 'utf-8');
      }
    } else {
      lesson.type = 'pdf';
      lesson.contentUrl = '/lessons/' + lesson.file;
    }

    res.json(lesson);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ AUTHENTICATION ROUTES ============

// POST login
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const users = auth.loadUsers();
    const user = users.find(u => u.username === username);

    if (!user || !auth.comparePassword(password, user.password)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = auth.generateToken(user.id, user.username, user.role);
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST logout (client-side just deletes token)
app.post('/api/auth/logout', auth.authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET current user info
app.get('/api/auth/me', auth.authenticateToken, (req, res) => {
  const users = auth.loadUsers();
  const user = users.find(u => u.id === req.user.userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    email: user.email
  });
});

// ============ LESSON MANAGEMENT ROUTES (Protected) ============

// Helper: extract title/category/date/excerpt/content from either JSON body or multipart
function isPdfUpload(file) {
  if (!file) return false;
  const ext = path.extname(file.originalname || '').toLowerCase();
  return file.mimetype === 'application/pdf' || ext === '.pdf';
}

function extractLessonFields(req) {
  // Prefer uploaded file; detect PDF vs text
  let content = null; // text content (md/txt only)
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
    title: (req.body.title || '').trim(),
    category: (req.body.category || '').trim(),
    date: (req.body.date || '').trim(),
    excerpt: (req.body.excerpt || '').trim(),
    content,
    isPdf,
    fileBuffer,
    originalName: req.file ? req.file.originalname : null,
  };
}

// POST create new lesson (Writers and Admins only)
// Accepts either JSON { title, category, date, excerpt, content }
// or multipart/form-data with the same fields + optional file field "contentFile"
app.post(
  '/api/lessons',
  auth.authenticateToken,
  auth.requireRole('writer', 'admin'),
  (req, res, next) => {
    // Only run multer when Content-Type is multipart
    const ct = req.headers['content-type'] || '';
    if (ct.includes('multipart/form-data')) {
      return upload.single('contentFile')(req, res, next);
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
        const filePath = path.join(LESSONS_DIR, file);
        fs.writeFileSync(filePath, fileBuffer);
        console.log(`📄 Saved PDF: ${file} (from ${originalName})`);
      } else {
        type = 'markdown';
        file = `${id}.md`;
        const filePath = path.join(LESSONS_DIR, file);
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`📝 Saved: ${file}${originalName ? ' (from ' + originalName + ')' : ''}`);
      }

      const lesson = {
        id,
        title,
        category,
        date,
        excerpt,
        file,
        type,
        createdBy: req.user.username,
        userId: req.user.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      lessons.push(lesson);

      saveManifest(lessons);

      res.status(201).json(lesson);
    } catch (err) {
      console.error('Error creating lesson:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

// PUT update lesson (Only creator or Admin)
// Accepts JSON or multipart (with optional contentFile)
app.put(
  '/api/lessons/:id',
  auth.authenticateToken,
  (req, res, next) => {
    const ct = req.headers['content-type'] || '';
    if (ct.includes('multipart/form-data')) {
      return upload.single('contentFile')(req, res, next);
    }
    next();
  },
  (req, res) => {
    try {
      const { title, category, date, excerpt, content, isPdf, fileBuffer, originalName } =
        extractLessonFields(req);
      const lessons = loadManifest();

      const lessonIndex = lessons.findIndex((l) => l.id === req.params.id);
      if (lessonIndex === -1) {
        return res.status(404).json({ error: 'Lesson not found' });
      }

      const lesson = lessons[lessonIndex];

      // Check permissions: Only creator or admin can edit
      if (req.user.role !== 'admin' && lesson.userId !== req.user.userId) {
        return res.status(403).json({ error: 'You can only edit your own lessons' });
      }

      // Update metadata fields
      if (title) lesson.title = title;
      if (category) lesson.category = category;
      if (date) lesson.date = date;
      if (excerpt) lesson.excerpt = excerpt;
      lesson.updatedAt = new Date().toISOString();
      lesson.updatedBy = req.user.username;

      // Replace content file if a new one was uploaded
      if (fileBuffer) {
        // Remove old file if path changes (e.g. md -> pdf or vice versa)
        const oldPath = path.join(LESSONS_DIR, lesson.file);
        if (isPdf) {
          lesson.type = 'pdf';
          lesson.file = `pdfs/${lesson.id}.pdf`;
          const newPath = path.join(LESSONS_DIR, lesson.file);
          fs.writeFileSync(newPath, fileBuffer);
          if (oldPath !== newPath && fs.existsSync(oldPath)) {
            try { fs.unlinkSync(oldPath); } catch (_) {}
          }
          console.log(`📄 Updated PDF: ${lesson.file} (from ${originalName})`);
        } else {
          lesson.type = 'markdown';
          lesson.file = `${lesson.id}.md`;
          const newPath = path.join(LESSONS_DIR, lesson.file);
          fs.writeFileSync(newPath, content, 'utf-8');
          if (oldPath !== newPath && fs.existsSync(oldPath)) {
            try { fs.unlinkSync(oldPath); } catch (_) {}
          }
          console.log(`✏️ Updated: ${lesson.file} (from ${originalName})`);
        }
      } else if (content !== null && content !== undefined) {
        // JSON text update for markdown lessons
        const filePath = path.join(LESSONS_DIR, lesson.file);
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`✏️ Updated: ${lesson.file}`);
      }

      lessons[lessonIndex] = lesson;
      saveManifest(lessons);

      res.json(lesson);
    } catch (err) {
      console.error('Error updating lesson:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

// DELETE lesson (Only creator or Admin)
app.delete('/api/lessons/:id', auth.authenticateToken, (req, res) => {
  try {
    const lessons = loadManifest();
    const lesson = lessons.find((l) => l.id === req.params.id);

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && lesson.userId !== req.user.userId) {
      return res.status(403).json({ error: 'You can only delete your own lessons' });
    }

    // Delete .md file
    const filePath = path.join(LESSONS_DIR, lesson.file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Deleted: ${lesson.file}`);
    }

    // Remove from manifest
    const filteredLessons = lessons.filter((l) => l.id !== req.params.id);
    saveManifest(filteredLessons);

    res.json({ message: 'Lesson deleted' });
  } catch (err) {
    console.error('Error deleting lesson:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============ ADMIN ROUTES ============

// GET all lessons with creator info (Admin only)
app.get('/api/admin/lessons', auth.authenticateToken, auth.requireRole('admin'), (req, res) => {
  try {
    const lessons = loadManifest();
    res.json(lessons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all users (Admin only)
app.get('/api/admin/users', auth.authenticateToken, auth.requireRole('admin'), (req, res) => {
  try {
    const users = auth.loadUsers();
    // Don't send passwords
    const safeUsers = users.map(u => ({
      id: u.id,
      username: u.username,
      role: u.role,
      email: u.email,
      createdAt: u.createdAt
    }));
    res.json(safeUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create writer account (Admin only)
app.post('/api/admin/users', auth.authenticateToken, auth.requireRole('admin'), (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ error: 'Username, password, and email required' });
    }

    const users = auth.loadUsers();

    // Check if username already exists
    if (users.some(u => u.username === username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const newUser = {
      id: `writer_${Date.now()}`,
      username,
      password: auth.hashPassword(password),
      role: 'writer',
      email,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    auth.saveUsers(users);

    res.status(201).json({
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
      email: newUser.email,
      createdAt: newUser.createdAt
    });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update user (Admin only)
app.put('/api/admin/users/:userId', auth.authenticateToken, auth.requireRole('admin'), (req, res) => {
  try {
    const { email, password } = req.body;
    const users = auth.loadUsers();
    const userIndex = users.findIndex(u => u.id === req.params.userId);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (email) users[userIndex].email = email;
    if (password) users[userIndex].password = auth.hashPassword(password);

    auth.saveUsers(users);

    res.json({
      id: users[userIndex].id,
      username: users[userIndex].username,
      role: users[userIndex].role,
      email: users[userIndex].email
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE user (Admin only)
app.delete('/api/admin/users/:userId', auth.authenticateToken, auth.requireRole('admin'), (req, res) => {
  try {
    // Prevent deleting the last admin
    const users = auth.loadUsers();
    const user = users.find(u => u.id === req.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1) {
      return res.status(400).json({ error: 'Cannot delete the last admin' });
    }

    const filteredUsers = users.filter(u => u.id !== req.params.userId);
    auth.saveUsers(filteredUsers);

    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 HIM Youth Lessons Server running on http://localhost:${PORT}`);
  console.log(`🔐 Login: http://localhost:${PORT}/login.html`);
  console.log(`👨‍💼 Admin Panel: http://localhost:${PORT}/admin.html`);
  console.log(`📚 Public Lessons: http://localhost:${PORT}/index.html`);
  console.log(`\n📁 Lessons stored in: ${LESSONS_DIR}\n`);
});
