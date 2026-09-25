// HIM Youth Thailand — lesson library
// Fully static: reads lessons/manifest.json + one Markdown file per lesson.
// No backend, no database — add a .md file and a manifest entry to publish a lesson.

const state = {
  lessons: [],
  category: 'all',
  query: '',
};

const listEl = document.getElementById('lesson-list');
const emptyEl = document.getElementById('empty-state');
const catsEl = document.getElementById('categories');
const searchEl = document.getElementById('search');
const viewList = document.getElementById('view-list');
const viewReader = document.getElementById('view-reader');
const readerContent = document.getElementById('reader-content');
const backLink = document.getElementById('back-link');

init();

async function init() {
  try {
    const res = await fetch('lessons/manifest.json', { cache: 'no-store' });
    state.lessons = await res.json();
  } catch (err) {
    listEl.innerHTML = '<li>โหลดรายการบทเรียนไม่สำเร็จ ตรวจสอบไฟล์ lessons/manifest.json</li>';
    return;
  }

  // newest first
  state.lessons.sort((a, b) => (a.date < b.date ? 1 : -1));

  buildCategoryFilter();
  renderList();

  searchEl.addEventListener('input', () => {
    state.query = searchEl.value.trim().toLowerCase();
    renderList();
  });

  backLink.addEventListener('click', (e) => {
    e.preventDefault();
    history.pushState(null, '', location.pathname + location.search);
    showList();
  });

  window.addEventListener('hashchange', routeFromHash);
  routeFromHash();
}

function buildCategoryFilter() {
  const categories = ['all', ...new Set(state.lessons.map((l) => l.category))];
  catsEl.innerHTML = '';
  categories.forEach((cat) => {
    const btn = document.createElement('button');
    btn.textContent = cat === 'all' ? 'ทั้งหมด' : cat;
    btn.className = cat === state.category ? 'active' : '';
    btn.addEventListener('click', () => {
      state.category = cat;
      [...catsEl.children].forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderList();
    });
    catsEl.appendChild(btn);
  });
}

function renderList() {
  const filtered = state.lessons.filter((l) => {
    const inCategory = state.category === 'all' || l.category === state.category;
    const inQuery =
      !state.query ||
      l.title.toLowerCase().includes(state.query) ||
      (l.excerpt || '').toLowerCase().includes(state.query);
    return inCategory && inQuery;
  });

  listEl.innerHTML = '';
  emptyEl.hidden = filtered.length > 0;

  filtered.forEach((lesson) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#' + lesson.id;
    a.innerHTML = `
      <p class="lesson-meta"><span class="cat">${escapeHtml(lesson.category)}</span> · ${formatDate(lesson.date)}</p>
      <h2>${escapeHtml(lesson.title)}</h2>
      <p class="lesson-excerpt">${escapeHtml(lesson.excerpt || '')}</p>
    `;
    li.appendChild(a);
    listEl.appendChild(li);
  });
}

function routeFromHash() {
  const id = decodeURIComponent(location.hash.replace(/^#/, ''));
  if (!id) {
    showList();
    return;
  }
  const lesson = state.lessons.find((l) => l.id === id);
  if (!lesson) {
    showList();
    return;
  }
  openLesson(lesson);
}

async function openLesson(lesson) {
  readerContent.innerHTML = '<p>กำลังโหลดบทเรียน...</p>';
  showReader();
  window.scrollTo({ top: 0 });

  const isPdf =
    lesson.type === 'pdf' ||
    (lesson.file && String(lesson.file).toLowerCase().endsWith('.pdf'));

  try {
    if (isPdf) {
      const pdfUrl = 'lessons/' + lesson.file;
      readerContent.innerHTML = `
        <p class="r-meta"><span class="cat">${escapeHtml(lesson.category)}</span> · ${formatDate(lesson.date)}</p>
        <h1>${escapeHtml(lesson.title)}</h1>
        <div class="pdf-viewer-wrap" style="margin-top:16px;">
          <iframe
            src="${escapeHtml(pdfUrl)}"
            title="${escapeHtml(lesson.title)}"
            style="width:100%;height:80vh;border:2px solid #2c221e;border-radius:8px;background:#fff;"
          ></iframe>
          <p style="margin-top:12px;font-size:0.9rem;">
            <a href="${escapeHtml(pdfUrl)}" target="_blank" rel="noopener">📥 เปิด PDF ในแท็บใหม่ / ดาวน์โหลด</a>
          </p>
        </div>
      `;
    } else {
      const res = await fetch('lessons/' + lesson.file, { cache: 'no-store' });
      const md = await res.text();
      const body = window.marked ? marked.parse(md) : '<pre>' + escapeHtml(md) + '</pre>';
      readerContent.innerHTML = `
        <p class="r-meta"><span class="cat">${escapeHtml(lesson.category)}</span> · ${formatDate(lesson.date)}</p>
        <h1>${escapeHtml(lesson.title)}</h1>
        ${body}
      `;
    }
  } catch (err) {
    readerContent.innerHTML = '<p>โหลดเนื้อหาบทเรียนไม่สำเร็จ</p>';
  }
}

function showReader() {
  viewList.hidden = true;
  viewReader.hidden = false;
}

function showList() {
  viewReader.hidden = true;
  viewList.hidden = false;
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
