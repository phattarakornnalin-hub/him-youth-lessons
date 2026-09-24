// HIM Youth Thailand — Admin Panel with Authentication & User Management
const API_URL = 'http://localhost:3000/api';

// State
let allLessons = [];
let allUsers = [];
let currentUser = null;
let currentToken = null;

console.log('✅ admin-new.js loaded');

// DOM Elements
const userInfoSpan = document.getElementById('user-info');
const logoutBtn = document.getElementById('logout-btn');
const lessonForm = document.getElementById('lesson-form');
const lessonsList = document.getElementById('lessons-list');
const emptyLessons = document.getElementById('empty-lessons');
const searchLessons = document.getElementById('search-lessons');
const userForm = document.getElementById('user-form');
const usersList = document.getElementById('users-list');
const emptyUsers = document.getElementById('empty-users');
const searchUsers = document.getElementById('search-users');

console.log('DOM Elements loaded');

// ============ INITIALIZATION ============
checkAuth();

async function checkAuth() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  if (!token || !user) {
    window.location.href = '/login.html';
    return;
  }

  try {
    const userData = JSON.parse(user);
    
    // Verify token is still valid
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Error('Token invalid');
    }

    if (userData.role !== 'admin') {
      alert('⛔ Admin access only!');
      window.location.href = '/index.html';
      return;
    }

    currentToken = token;
    currentUser = userData;
    userInfoSpan.textContent = `👤 ${userData.username} (Admin)`;
    
    console.log('✅ Authentication passed');
    
    // Setup UI
    setupTabNavigation();
    
    // Load data
    await loadLessonsFromAPI();
    await loadUsersFromAPI();
    setupEventListeners();

  } catch (err) {
    console.error('Auth check failed:', err);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
  }
}

// ============ TAB NAVIGATION ============
function setupTabNavigation() {
  console.log('🔧 Setting up tab navigation');
  
  const tabButtons = document.querySelectorAll('.tab-btn');
  console.log(`Found ${tabButtons.length} tab buttons`);
  
  tabButtons.forEach((btn, index) => {
    const tabName = btn.getAttribute('data-tab');
    console.log(`Tab ${index}: ${tabName}`);
    
    btn.addEventListener('click', function() {
      console.log(`Clicked tab: ${tabName}`);
      
      // Remove active from all buttons
      tabButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // Hide all content
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      
      // Show selected content
      const contentId = tabName + '-tab';
      const content = document.getElementById(contentId);
      console.log(`Showing content: ${contentId}`, content);
      
      if (content) {
        content.classList.add('active');
      } else {
        console.error(`❌ Element not found: ${contentId}`);
      }
    });
  });
}

// ============ LOGOUT ============
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/index.html';
});

// ============ LESSON MANAGEMENT ============
async function loadLessonsFromAPI() {
  try {
    const res = await fetch(`${API_URL}/admin/lessons`, {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });

    if (!res.ok) throw new Error('Failed to load lessons');
    
    allLessons = await res.json();
    allLessons.sort((a, b) => (a.date < b.date ? 1 : -1));
    updateCategoryList();
    renderLessonsList();
  } catch (err) {
    console.error('Error loading lessons:', err);
    lessonsList.innerHTML = `<li style="color: red;">❌ ${err.message}</li>`;
  }
}

async function saveLesson(lesson) {
  try {
    const isUpdate = allLessons.some((l) => l.id === lesson.id);
    const method = isUpdate ? 'PUT' : 'POST';
    const url = isUpdate ? `${API_URL}/lessons/${lesson.id}` : `${API_URL}/lessons`;

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify(lesson),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to save lesson');
    }

    await loadLessonsFromAPI();
  } catch (err) {
    throw err;
  }
}

async function deleteLesson(id) {
  try {
    const res = await fetch(`${API_URL}/lessons/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });

    if (!res.ok) throw new Error('Failed to delete lesson');
    await loadLessonsFromAPI();
  } catch (err) {
    throw err;
  }
}

function generateNextID() {
  if (allLessons.length === 0) return '0001';
  const maxID = Math.max(
    ...allLessons.map((l) => {
      const match = l.id.match(/^(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })
  );
  return String(maxID + 1).padStart(4, '0');
}

function renderLessonsList() {
  const query = searchLessons.value.toLowerCase();
  const filtered = allLessons.filter(
    (l) =>
      l.title.toLowerCase().includes(query) ||
      l.category.toLowerCase().includes(query) ||
      l.id.toLowerCase().includes(query) ||
      (l.createdBy && l.createdBy.toLowerCase().includes(query))
  );

  lessonsList.innerHTML = '';
  emptyLessons.hidden = filtered.length > 0;

  filtered.forEach((lesson) => {
    const div = document.createElement('div');
    div.className = 'lesson-card';
    const creatorInfo = lesson.createdBy ? `<p class="lesson-card-creator">👤 By: ${escapeHtml(lesson.createdBy)}</p>` : '';
    
    div.innerHTML = `
      <div class="lesson-card-head">
        <div>
          <h3>${escapeHtml(lesson.title)}</h3>
          <p class="lesson-card-meta">
            <span class="cat">${escapeHtml(lesson.category)}</span> · ${formatDate(lesson.date)}
          </p>
          ${creatorInfo}
        </div>
      </div>
      <p class="lesson-card-excerpt">${escapeHtml(lesson.excerpt)}</p>
      <p class="lesson-card-id">ID: <code>${escapeHtml(lesson.id)}</code></p>
      <div class="lesson-card-actions">
        <button class="btn btn-sm btn-secondary" data-edit="${lesson.id}">✏️ แก้ไข</button>
        <button class="btn btn-sm btn-danger" data-delete="${lesson.id}">🗑️ ลบ</button>
      </div>
    `;

    div.querySelector('[data-edit]').addEventListener('click', () => loadLessonForEdit(lesson));
    div.querySelector('[data-delete]').addEventListener('click', () => {
      if (confirm(`ยืนยันการลบ "${lesson.title}"?`)) {
        deleteLesson(lesson.id);
      }
    });

    lessonsList.appendChild(div);
  });
}

function loadLessonForEdit(lesson) {
  document.getElementById('lesson-title').value = lesson.title;
  document.getElementById('lesson-category').value = lesson.category;
  document.getElementById('lesson-date').value = lesson.date;
  document.getElementById('lesson-excerpt').value = lesson.excerpt;
  document.getElementById('lesson-content').value = lesson.content || '';
  
  lessonForm.dataset.editId = lesson.id;
  lessonForm.querySelector('button[type="submit"]').textContent = '💾 อัปเดตบทเรียน';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateCategoryList() {
  const categories = [...new Set(allLessons.map((l) => l.category))];
  const datalist = document.getElementById('categories');
  datalist.innerHTML = categories.map((cat) => `<option>${cat}</option>`).join('');
}

// ============ USER MANAGEMENT ============
async function loadUsersFromAPI() {
  try {
    const res = await fetch(`${API_URL}/admin/users`, {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });

    if (!res.ok) throw new Error('Failed to load users');
    
    allUsers = await res.json();
    renderUsersList();
  } catch (err) {
    console.error('Error loading users:', err);
    usersList.innerHTML = `<p style="color: red;">❌ ${err.message}</p>`;
  }
}

async function createUser(username, email, password) {
  try {
    const res = await fetch(`${API_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify({ username, email, password })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create user');
    }

    await loadUsersFromAPI();
    return true;
  } catch (err) {
    throw err;
  }
}

async function deleteUser(userId) {
  try {
    const res = await fetch(`${API_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to delete user');
    }

    await loadUsersFromAPI();
  } catch (err) {
    throw err;
  }
}

function renderUsersList() {
  const query = searchUsers.value.toLowerCase();
  const filtered = allUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.role.toLowerCase().includes(query)
  );

  usersList.innerHTML = '';
  emptyUsers.hidden = filtered.length > 0;

  filtered.forEach((user) => {
    const div = document.createElement('div');
    div.className = 'user-card';
    
    const isCurrentUser = user.id === currentUser.id;
    const roleClass = user.role === 'admin' ? 'admin' : 'writer';
    
    div.innerHTML = `
      <div class="user-info">
        <h4>${escapeHtml(user.username)}</h4>
        <p>📧 ${escapeHtml(user.email)}</p>
        <p><span class="user-role ${roleClass}">${user.role.toUpperCase()}</span></p>
      </div>
      <div class="user-actions">
        ${!isCurrentUser ? `<button class="btn btn-sm btn-danger" data-delete="${user.id}">🗑️ ลบ</button>` : '<span style="color: #999; font-size: 0.9rem;">👤 You</span>'}
      </div>
    `;

    if (!isCurrentUser) {
      div.querySelector('[data-delete]').addEventListener('click', () => {
        if (confirm(`ยืนยันการลบ "${user.username}"?`)) {
          deleteUser(user.id);
        }
      });
    }

    usersList.appendChild(div);
  });
}

// ============ EVENT LISTENERS ============
function setupEventListeners() {
  // Lesson form
  lessonForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const isUpdate = lessonForm.dataset.editId;
    const lessonID = isUpdate ? lessonForm.dataset.editId : generateNextID();

    const lesson = {
      id: lessonID,
      title: document.getElementById('lesson-title').value.trim(),
      category: document.getElementById('lesson-category').value.trim(),
      date: document.getElementById('lesson-date').value,
      excerpt: document.getElementById('lesson-excerpt').value.trim(),
      file: `${lessonID}.md`,
      content: document.getElementById('lesson-content').value,
    };

    try {
      await saveLesson(lesson);
      alert(`✅ ${isUpdate ? 'อัปเดต' : 'บันทึก'}สำเร็จ!\nID: ${lessonID}`);
      lessonForm.reset();
      lessonForm.dataset.editId = '';
      setTodayDate();
    } catch (err) {
      alert('บันทึกไม่สำเร็จ: ' + err.message);
    }
  });

  // User form
  userForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('new-username').value.trim();
    const email = document.getElementById('new-email').value.trim();
    const password = document.getElementById('new-password').value;

    if (password.length < 6) {
      alert('❌ รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    try {
      await createUser(username, email, password);
      alert(`✅ สร้าง Writer "${username}" สำเร็จ!`);
      userForm.reset();
    } catch (err) {
      alert('สร้างไม่สำเร็จ: ' + err.message);
    }
  });

  searchLessons.addEventListener('input', renderLessonsList);
  searchUsers.addEventListener('input', renderUsersList);

  setTodayDate();
  
  console.log('✅ Event listeners setup complete');
}

// ============ UTILITIES ============
function setTodayDate() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('lesson-date').value = today;
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return iso;
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

console.log('✅ All functions loaded');