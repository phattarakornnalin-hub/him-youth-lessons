# HIM Youth Thailand — Lesson Library v2.0

A **lesson management system** with:
- 📱 **Admin Panel** — Create, Edit, Delete lessons easily
- 🌐 **Website** — Browse and read lessons (index.html)
- 💾 **Auto-sync** — Changes appear instantly (no Export/Import needed)
- 🔧 **Backend** — Node.js Express server manages files

**What's new:**
- ✅ No more manual JSON editing
- ✅ No more manual file copying
- ✅ Real-time updates (Admin → Website instantly)
- ✅ Simple API for lesson management

## How it works

1. **Admin Panel** (`admin.html`) — Create/Edit/Delete lessons via a user-friendly form
2. **Backend Server** (`server.js`) — Saves lessons to disk immediately
   - Updates `lessons/manifest.json`
   - Writes `.md` files to `lessons/` folder
3. **Website** (`index.html`) — Reads from `lessons/manifest.json` and displays lessons

Everything syncs automatically — no Export/Import step needed!

## Getting Started (5 minutes)

### 1. Install Node.js
- Download: https://nodejs.org/ (LTS version)

### 2. Install Dependencies
```bash
cd him-youth-lessons-updated
npm install
```

### 3. Run the Server
```bash
npm start
```

You'll see:
```
🚀 HIM Youth Lessons Server running on http://localhost:3000
📄 Admin Panel: http://localhost:3000/admin.html
📚 Lessons: http://localhost:3000/index.html
```

### 4. Open Admin Panel
Visit: **http://localhost:3000/admin.html**

### 5. Create Your First Lesson
1. Fill in the form (ID, Title, Category, Date, Excerpt, Content)
2. Click **💾 บันทึกบทเรียน**
3. Visit **http://localhost:3000** to see it live!

**That's it!** No Export/Import steps needed. Changes appear instantly.

## Adding a new lesson (Via Admin Panel)

1. Go to **http://localhost:3000/admin.html**
2. Fill in the form:
   - **ID**: e.g., `0004-my-new-lesson` (URL-safe)
   - **Title**: `ชื่อบทเรียน`
   - **Category**: e.g., `หมวดที่ต้องการ` (auto-added to filter)
   - **Date**: `2026-10-01`
   - **Excerpt**: Brief summary (shown in list)
   - **Content**: Markdown format
3. Click **💾 บันทึกบทเรียน**
4. Done! The lesson appears on the website instantly.

## Editing or removing a lesson

### Edit:
1. Click **✏️ แก้ไข** on the lesson
2. Modify the form
3. Click **💾 อัปเดตบทเรียน**

### Delete:
1. Click **🗑️ ลบ** on the lesson
2. Confirm deletion

## For Detailed Setup Instructions

- **New to Node.js?** → See [SETUP.md](SETUP.md)
- **Quick start guide?** → See [QUICK_START.md](QUICK_START.md)
- **Admin Panel tutorial?** → See [ADMIN_GUIDE.md](ADMIN_GUIDE.md)

## Deploying to Production

Since this is a **Node.js app** (not static HTML), you'll need a host that 
supports Node.js:

### Heroku (Easiest)
```bash
heroku create your-app-name
git push heroku main
heroku open
```
→ Your app will be live at `your-app-name.herokuapp.com`

### Railway (Recommended)
- Visit https://railway.app
- Connect your GitHub repo
- Deploy with one click
- Free tier available

### Render / Vercel / AWS / DigitalOcean
- All support Node.js apps
- Follow their deployment guides

**Do NOT use GitHub Pages or static hosts** — they don't run Node.js servers.

## Notes

- The three sample lessons (`0001`–`0003`) are placeholder content — 
  feel free to edit or delete them via the Admin Panel.
- Fonts (Noto Serif Thai, Sarabun) and Markdown renderer (marked.js) 
  load from public CDNs, so internet is needed for proper rendering.
- All data is stored in `lessons/` folder on disk — safe and portable.
- For detailed guides, see **SETUP.md**, **QUICK_START.md**, and **ADMIN_GUIDE.md**.
