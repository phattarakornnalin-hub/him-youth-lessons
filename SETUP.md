# 🔧 วิธีการติดตั้งและรันเซิร์ฟเวอร์

## ✅ ความต้องการ

- **Node.js** (v14 ขึ้นไป)
  - Download: https://nodejs.org/

## 📋 ขั้นตอนการติดตั้ง

### ขั้นตอนที่ 1: ติดตั้ง Node.js

**บน Windows/Mac/Linux:**
1. ไปที่ https://nodejs.org/
2. Download LTS version
3. ติดตั้ง (ตามค่าเริ่มต้น)

**ตรวจสอบการติดตั้ง:**
```bash
node --version
npm --version
```

### ขั้นตอนที่ 2: ติดตั้ง Dependencies

```bash
# ไปที่โฟลเดอร์โปรเจ็ค
cd him-youth-lessons-updated

# ติดตั้ง packages
npm install
```

**ผลลัพธ์:**
- สร้างโฟลเดอร์ `node_modules/`
- สร้างไฟล์ `package-lock.json`

### ขั้นตอนที่ 3: รันเซิร์ฟเวอร์

```bash
npm start
```

**ผลลัพธ์:**
```
🚀 HIM Youth Lessons Server running on http://localhost:3000
📄 Admin Panel: http://localhost:3000/admin.html
📚 Lessons: http://localhost:3000/index.html
```

---

## 🌐 เปิดแอปพลิเคชัน

### Admin Panel (จัดการบทเรียน)
```
http://localhost:3000/admin.html
```

### Website (ดูบทเรียน)
```
http://localhost:3000/index.html
หรือ
http://localhost:3000/
```

---

## 🛑 หยุดเซิร์ฟเวอร์

ในหน้าต่าง Terminal ที่รัน `npm start`:
- **Windows/Linux:** Ctrl + C
- **Mac:** Cmd + C

---

## ❌ ปัญหาทั่วไป

### "Port 3000 is already in use"
**วิธีแก้:**
```bash
# ใช้ port อื่น
PORT=5000 npm start
```

จากนั้นเปิด: `http://localhost:5000/admin.html`

### "npm: command not found"
**วิธีแก้:**
- Node.js ยังไม่ติดตั้ง
- ติดตั้งจาก https://nodejs.org/
- เปิด Terminal ใหม่หลังติดตั้ง

### "Cannot find module 'express'"
**วิธีแก้:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Admin Panel ไม่เชื่อมต่อกับ Server
**ตรวจสอบ:**
1. Server กำลังทำงาน (`npm start`)
2. เปิดที่ `http://localhost:3000/admin.html` (ไม่ใช่ file://)
3. ลอง Hard Refresh: `Ctrl+Shift+R` (Windows/Linux) หรือ `Cmd+Shift+R` (Mac)

---

## 🔄 Workflow ทั่วไป

### วันธรรมชาติ (Local Development)

1. **เปิด Terminal ก่อน**
   ```bash
   npm start
   ```

2. **เปิด Admin Panel**
   - http://localhost:3000/admin.html

3. **สร้าง/แก้ไข/ลบบทเรียน**
   - ข้อมูลบันทึกอัตโนมัติ

4. **ดูผลลัพธ์บน Website**
   - http://localhost:3000/index.html
   - อัปเดตทันที (ไม่ต้อง Reload)

5. **หยุดเซิร์ฟเวอร์เมื่อเสร็จ**
   - Ctrl+C (หรือ Cmd+C บน Mac)

---

## 📤 Deploy ไปยัง Production

### ตัวเลือกที่ 1: Heroku (แนะนำ)

**ติดตั้ง Heroku CLI:**
- Windows/Mac/Linux: https://devcenter.heroku.com/articles/heroku-cli

**Deploy:**
```bash
# สร้างแอป Heroku
heroku create your-app-name

# Deploy
git push heroku main

# ดู URL
heroku open
```

### ตัวเลือกที่ 2: Railway

1. ไปที่ https://railway.app
2. Connect GitHub
3. Import repo
4. ระบบจะ Deploy อัตโนมัติ

### ตัวเลือกที่ 3: Render

1. ไปที่ https://render.com
2. Create New > Web Service
3. Connect GitHub
4. ใส่ build & start commands:
   ```
   Build: npm install
   Start: node server.js
   ```
5. Deploy!

---

## 📁 โครงสร้างไฟล์

```
him-youth-lessons-updated/
├── server.js              ← Backend Express server
├── package.json           ← Node.js dependencies
├── package-lock.json      ← Lock file (auto-generated)
├── node_modules/          ← Dependencies (auto-generated)
│
├── admin.html             ← Admin Panel UI
├── admin.js               ← Admin Panel (API client)
├── admin-style.css        ← Admin Panel styling
│
├── index.html             ← Website (บทเรียน)
├── app.js                 ← Website JS
├── style.css              ← Website styling
│
├── lessons/               ← บทเรียนข้อมูล
│   ├── manifest.json      ← รายชื่อบทเรียน (auto-updated)
│   ├── 0001-*.md          ← เนื้อหาบทเรียน (auto-updated)
│   ├── 0002-*.md
│   └── ...
│
├── README.md              ← เอกสารหลัก
├── SETUP.md               ← ไฟล์นี้
├── QUICK_START.md         ← เริ่มต้นทันที
└── ADMIN_GUIDE.md         ← คู่มือ Admin Panel
```

---

## 🔐 Environment Variables (Optional)

สร้างไฟล์ `.env` ในโฟลเดอร์หลัก:

```
PORT=3000
NODE_ENV=production
```

จากนั้น:
```bash
npm start
```

---

## 🚀 ที่ทำได้ต่อไป

- 🌙 เพิ่ม Dark Mode
- 🔐 เพิ่ม Authentication
- 📊 เพิ่ม Analytics
- 🔄 Sync ไปยัง Database (MongoDB/Firebase)
- 📱 Mobile App

---

## 📞 ช่วยเหลือ

ถ้ามีปัญหา:
1. ดู **ADMIN_GUIDE.md** สำหรับการใช้ Admin Panel
2. ลอง Hard Refresh: `Ctrl+Shift+R`
3. ดู browser console (F12)
4. ลอง port อื่น: `PORT=5000 npm start`
