# 🚀 เริ่มต้นใช้งาน Admin Panel

## 5 นาทีแรก

### 0. ติดตั้ง Node.js & Dependencies

```bash
# ตรวจสอบ Node.js
node --version

# ถ้ายังไม่มี ให้ download จาก https://nodejs.org/

# ติดตั้ง dependencies
npm install
```

### 1. รันเซิร์ฟเวอร์

```bash
# ในโฟลเดอร์ him-youth-lessons-updated/
npm start

# หรือ
node server.js
```

**ผลลัพธ์:**
```
🚀 HIM Youth Lessons Server running on http://localhost:3000
📄 Admin Panel: http://localhost:3000/admin.html
📚 Lessons: http://localhost:3000/index.html
```

### 2. เปิด Admin Panel ในเบราว์เซอร์

เปิด: **`http://localhost:3000/admin.html`**

### 3. สร้างบทเรียนตัวแรกเลย

1. **กรอกข้อมูล:**
   - ID: `0004-my-first-lesson`
   - ชื่อบทเรียน: `บทเรียนแรกของฉัน`
   - หมวดหมู่: `บทเรียนใหม่`
   - เนื้อหา:
     ```markdown
     # บทเรียนแรกของฉัน
     
     นี่คือเนื้อหาแรกของบทเรียน
     
     ## หัวข้อสำคัญ
     
     - จุดที่ 1
     - จุดที่ 2
     ```

2. **คลิก บันทึกบทเรียน** 💾

3. **ดู Admin Panel** — บทเรียนใหม่จะปรากฏในรายการด้านล่าง

### 4. ดูผลลัพธ์ในเว็บไซต์ (Real-time!)

1. **ไม่ต้องเก็บไฟล์ manually!** ✨
2. เปิด `http://localhost:3000/` ในแท็บใหม่
3. บทเรียนใหม่จะปรากฏ **ทันที** (อัตโนมัติ)
4. ไม่ต้อง Export หรือ Refresh!

---

## ขั้นตอนต่อไป (Deploy)

### Heroku (ง่ายที่สุด)
1. สมัครที่ https://www.heroku.com
2. Install Heroku CLI
3. ในโฟลเดอร์โปรเจ็ค:
   ```bash
   heroku create
   git push heroku main
   ```
4. เว็บไซต์ live ที่ `your-app-name.herokuapp.com`

### Railway (ทางเลือก)
1. สมัครที่ https://railway.app
2. Connect GitHub repo
3. Deploy ใน dashboard
4. เสร็จ! ได้ URL ทันที

### Render
1. สมัครที่ https://render.com
2. Create New > Web Service
3. Connect GitHub
4. Set build & start commands
5. Deploy!

---

## 👨‍💻 เคล็ดลับสำหรับ Admin Panel

### ค้นหาบทเรียน
ใช้ input ค้นหาเพื่อหาบทเรียนตามชื่อ หมวด หรือ ID

### แก้ไขบทเรียน
1. คลิก **✏️ แก้ไข** บนบทเรียนที่ต้องการ
2. ฟอร์มจะเต็มข้อมูล
3. ทำการเปลี่ยนแปลง
4. คลิก **💾 อัปเดตบทเรียน**

### ลบบทเรียน
1. คลิก **🗑️ ลบ**
2. ยืนยันการลบ
3. เสร็จ!

### นำเข้าบทเรียนเก่า
ถ้ามี `manifest.json` เก่า:
1. คลิก **📥 นำเข้า JSON**
2. เลือกไฟล์
3. บทเรียนจะถูกโหลด (แต่ต้องเพิ่มเนื้อหาใหม่ถ้ายังไม่มี)

---

## ⚠️ สิ่งสำคัญที่ต้องรู้

1. **ข้อมูลเก็บใน Browser** — ถ้า Clear Cache ข้อมูลจะหาย
   → **Export JSON อย่างน้อยทุกสัปดาห์**

2. **ต่างเบราว์เซอร์ = ต่างข้อมูล**
   → ใช้ browser เดียวกัน หรือ Import/Export เพื่อ sync

3. **ต้อง Export → วาง files → reload ฝั่ง index.html**
   → Admin panel และเว็บไซต์หลักทำงานแยกกัน

---

## 🔗 Resources

- ดู **ADMIN_GUIDE.md** เพื่อรายละเอียด
- ดู **README.md** เพื่อเข้าใจโครงสร้าง
- Markdown guide: https://www.markdownguide.org/

---

**Ready? มาเริ่ม! 🎯**

ใหญ่สุด เปิด `admin.html` และสร้างบทเรียนตัวแรก!
