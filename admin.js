// HIM Youth Thailand — Admin Panel
// Manages lessons via backend API (server.js)
// Auto-generates sequential IDs: 0001, 0002, 0003...

const API_URL = 'http://localhost:3000/api';
let allLessons = [];

const form = document.getElementById('lesson-form');
const titleInput = document.getElementById('lesson-title');
const categoryInput = document.getElementById('lesson-category');
const dateInput = document.getElementById('lesson-date');
const excerptInput = document.getElementById('lesson-excerpt');
const contentInput = document.getElementById('lesson-content');
const lessonsList = document.getElementById('lessons-list');
const emptyState = document.getElementById('empty-lessons');
const searchInput = document.getElementById('search-lessons');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFile = document.getElementById('import-file');

// Initialize
init();
setupEventListeners();
setTodayDate();

async function init() {
  await loadLessonsFromAPI();
}

async function loadLessonsFromAPI() {
  try {
    const res = await fetch(`${API_URL}/lessons`);
    if (!res.ok) {
      throw new Error('Failed to load lessons from server');
    }
    allLessons = await res.json();
    allLessons.sort((a, b) => (a.date < b.date ? 1 : -1));
    updateCategoryList();
    renderLessonsList();
  } catch (err) {
    console.error('Error loading lessons:', err);
    lessonsList.innerHTML = `<li style="color: red;">❌ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้<br/>ตรวจสอบว่า server.js กำลังทำงาน (node server.js)</li>`;
  }
}

// Generate next sequential ID
function generateNextID() {
  if (allLessons.length === 0) return '0001';
  
  // ดึง ID สูงสุด
  const maxID = Math.max(
    ...allLessons.map((l) => {
      const match = l.id.match(/^(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })
  );
  
  return String(maxID + 1).padStart(4, '0');
}

async function saveLesson(lesson) {
  try {
    const isUpdate = allLessons.some((l) => l.id === lesson.id);
    const method = isUpdate ? 'PUT' : 'POST';
    const url = isUpdate ? `${API_URL}/lessons/${lesson.id}` : `${API_URL}/lessons`;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
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
    });

    if (!res.ok) {
      throw new Error('Failed to delete lesson');
    }

    await loadLessonsFromAPI();
  } catch (err) {
    throw err;
  }
}

function setupEventListeners() {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Auto-generate ID (create mode only)
    const isUpdate = form.dataset.editId;
    const lessonID = isUpdate ? form.dataset.editId : generateNextID();

    const lesson = {
      id: lessonID,
      title: titleInput.value.trim(),
      category: categoryInput.value.trim(),
      date: dateInput.value,
      excerpt: excerptInput.value.trim(),
      file: `${lessonID}.md`,
      content: contentInput.value,
    };

    try {
      await saveLesson(lesson);
      
      if (!isUpdate) {
        alert(`✅ บันทึกสำเร็จ!\nID: ${lessonID}`);
      } else {
        alert('✅ อัปเดตบทเรียนสำเร็จ!');
      }
      
      form.reset();
      form.dataset.editId = '';
      setTodayDate();
    } catch (err) {
      alert('บันทึกไม่สำเร็จ: ' + err.message);
    }
  });

  searchInput.addEventListener('input', renderLessonsList);

  exportBtn.addEventListener('click', exportToJSON);
  importBtn.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', importFromJSON);
}

function renderLessonsList() {
  const query = searchInput.value.toLowerCase();
  const filtered = allLessons.filter(
    (l) =>
      l.title.toLowerCase().includes(query) ||
      l.category.toLowerCase().includes(query) ||
      l.id.toLowerCase().includes(query)
  );

  lessonsList.innerHTML = '';
  emptyState.hidden = filtered.length > 0;

  filtered.forEach((lesson) => {
    const div = document.createElement('div');
    div.className = 'lesson-card';
    div.innerHTML = `
      <div class="lesson-card-head">
        <div>
          <h3>${escapeHtml(lesson.title)}</h3>
          <p class="lesson-card-meta">
            <span class="cat">${escapeHtml(lesson.category)}</span> · ${formatDate(lesson.date)}
          </p>
        </div>
      </div>
      <p class="lesson-card-excerpt">${escapeHtml(lesson.excerpt)}</p>
      <p class="lesson-card-id">ID: <code>${escapeHtml(lesson.id)}</code></p>
      <div class="lesson-card-actions">
        <button class="btn btn-sm btn-secondary" data-edit="${lesson.id}">✏️ แก้ไข</button>
        <button class="btn btn-sm btn-danger" data-delete="${lesson.id}">🗑️ ลบ</button>
      </div>
    `;

    div
      .querySelector(`[data-edit]`)
      .addEventListener('click', () => loadLessonForEdit(lesson));

    div
      .querySelector(`[data-delete]`)
      .addEventListener('click', () => {
        if (confirm(`ยืนยันการลบ "${lesson.title}"?`)) {
          deleteLesson(lesson.id);
        }
      });

    lessonsList.appendChild(div);
  });
}

function loadLessonForEdit(lesson) {
  titleInput.value = lesson.title;
  categoryInput.value = lesson.category;
  dateInput.value = lesson.date;
  excerptInput.value = lesson.excerpt;
  contentInput.value = lesson.content;

  form.dataset.editId = lesson.id;
  form.querySelector('button[type="submit"]').textContent = '💾 อัปเดตบทเรียน';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateCategoryList() {
  const categories = [...new Set(allLessons.map((l) => l.category))];
  const datalist = document.getElementById('categories');
  datalist.innerHTML = categories.map((cat) => `<option>${cat}</option>`).join('');
}

function exportToJSON() {
  if (allLessons.length === 0) {
    alert('ยังไม่มีบทเรียนที่จะส่งออก');
    return;
  }

  const manifest = allLessons.map((l) => ({
    id: l.id,
    title: l.title,
    category: l.category,
    date: l.date,
    excerpt: l.excerpt,
    file: l.file,
  }));

  downloadJSON(manifest, 'manifest.json');

  alert(
    '✅ ส่งออก manifest.json สำเร็จ!\n\n' +
      'ไฟล์ทั้งหมด (.md และ manifest.json) อยู่ในเซิร์ฟเวอร์แล้ว\n' +
      'เปิด index.html เพื่อดูผลลัพธ์'
  );
}

function downloadJSON(data, filename) {
  const json = JSON.stringify(data, null, 2);
  downloadText(json, filename);
}

function downloadText(text, filename) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importFromJSON(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const manifest = JSON.parse(event.target.result);
      if (!Array.isArray(manifest)) {
        alert('ไฟล์ต้องเป็น JSON array ของบทเรียน');
        return;
      }

      let imported = 0;
      for (const lesson of manifest) {
        if (lesson.id && lesson.title) {
          lesson.content = lesson.content || '';
          await saveLesson(lesson);
          imported++;
        }
      }

      alert(`นำเข้าสำเร็จ: ${imported} บทเรียน`);
      loadLessonsFromAPI();
    } catch (err) {
      alert('นำเข้าไม่สำเร็จ: ' + err.message);
    }
  };
  reader.readAsText(file);
  importFile.value = '';
}

function setTodayDate() {
  const today = new Date().toISOString().split('T')[0];
  dateInput.value = today;
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