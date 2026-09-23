// HIM Youth Thailand — Lesson Management Server
// Express backend for Create/Read/Update/Delete lessons
// Saves directly to lessons/ folder for instant updates on index.html

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('.'));

const LESSONS_DIR = path.join(__dirname, 'lessons');
const MANIFEST_FILE = path.join(LESSONS_DIR, 'manifest.json');

// Ensure lessons directory exists
if (!fs.existsSync(LESSONS_DIR)) {
  fs.mkdirSync(LESSONS_DIR, { recursive: true });
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

// GET all lessons
app.get('/api/lessons', (req, res) => {
  try {
    const lessons = loadManifest();
    res.json(lessons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single lesson with content
app.get('/api/lessons/:id', (req, res) => {
  try {
    const lessons = loadManifest();
    const lesson = lessons.find((l) => l.id === req.params.id);
    
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Read content from .md file
    const filePath = path.join(LESSONS_DIR, lesson.file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      lesson.content = content;
    }

    res.json(lesson);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new lesson
app.post('/api/lessons', (req, res) => {
  try {
    const { title, category, date, excerpt, content } = req.body;

    // Validate required fields
    if (!title || !category || !date || !excerpt || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const lessons = loadManifest();

    // Auto-generate sequential ID
    const id = generateNextID(lessons);
    const file = `${id}.md`;

    // Save .md file
    const filePath = path.join(LESSONS_DIR, file);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`📝 Saved: ${file}`);

    // Add to manifest
    const lesson = {
      id,
      title,
      category,
      date,
      excerpt,
      file,
    };
    lessons.push(lesson);

    // Save updated manifest
    saveManifest(lessons);

    res.status(201).json(lesson);
  } catch (err) {
    console.error('Error creating lesson:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update lesson
app.put('/api/lessons/:id', (req, res) => {
  try {
    const { title, category, date, excerpt, content } = req.body;
    const lessons = loadManifest();

    const lessonIndex = lessons.findIndex((l) => l.id === req.params.id);
    if (lessonIndex === -1) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const lesson = lessons[lessonIndex];

    // Update fields
    if (title !== undefined) lesson.title = title;
    if (category !== undefined) lesson.category = category;
    if (date !== undefined) lesson.date = date;
    if (excerpt !== undefined) lesson.excerpt = excerpt;

    // Update .md file if content provided
    if (content !== undefined) {
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
});

// DELETE lesson
app.delete('/api/lessons/:id', (req, res) => {
  try {
    const lessons = loadManifest();
    const lesson = lessons.find((l) => l.id === req.params.id);

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
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

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 HIM Youth Lessons Server running on http://localhost:${PORT}`);
  console.log(`📄 Admin Panel: http://localhost:${PORT}/admin.html`);
  console.log(`📚 Lessons: http://localhost:${PORT}/index.html`);
  console.log(`\n📁 Lessons stored in: ${LESSONS_DIR}\n`);
});