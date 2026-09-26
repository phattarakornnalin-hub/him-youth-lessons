# HIM Youth Lessons

ระบบจัดการบทเรียนสำหรับ **HIM Youth Thailand**  
รองรับการดูบทเรียนสาธารณะ + แผงผู้ดูแล (Admin / Writer) พร้อมระบบล็อกอินและ Role-based Access Control

เวอร์ชันนี้ได้รับการปรับปรุงด้านความปลอดภัย (hardened) ตามแนวทาง OWASP

---

## คุณสมบัติหลัก

- ดูรายการบทเรียนสาธารณะ (Markdown / PDF)
- ระบบล็อกอินด้วย JWT
- บทบาท: **Admin** และ **Writer**
- สร้าง / แก้ไข / ลบบทเรียน (Writer และ Admin)
- จัดการผู้ใช้ (Admin เท่านั้น)
- อัปโหลดไฟล์ PDF หรือ Markdown
- ป้องกันการโจมตีพื้นฐาน: Rate limiting, Helmet, bcrypt, CORS จำกัด, บล็อกไฟล์สำคัญ

---

## ความต้องการของระบบ

- Node.js 18 ขึ้นไป (แนะนำ 20+)
- npm

---

## การติดตั้งและเริ่มใช้งาน

### 1. ติดตั้ง dependencies

```bash
cd him-youth-lessons
npm install
```

### 2. ตั้งค่า Environment Variables

```bash
cp .env.example .env
```

แก้ไขไฟล์ `.env`:

```env
# สร้าง secret ที่แข็งแรง (อย่างน้อย 32 ตัวอักษร)
# ใช้คำสั่งนี้สร้างได้:
# node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_SECRET=ใส่รหัสลับที่ยาวและสุ่มที่นี่

PORT=3000

# ถ้า deploy จริง ให้ใส่โดเมน เช่น https://yourdomain.com
# ว่างไว้ = อนุญาตเฉพาะ same-origin
ALLOWED_ORIGINS=
```

### 3. รีเซ็ตรหัสผ่าน Admin (จำเป็น)

รหัสผ่านเดิม (SHA-256) ใช้ไม่ได้แล้ว ต้องสร้างรหัสใหม่ด้วย bcrypt:

```bash
node scripts/reset-admin-password.js "รหัสผ่านใหม่ของคุณ"
```

ตัวอย่าง:
```bash
node scripts/reset-admin-password.js "MyStrongP@ssw0rd!"
```

หลังจากรันคำสั่งนี้ จะสามารถล็อกอินด้วย:
- **Username:** `admin`
- **Password:** รหัสที่คุณตั้งไว้

### 4. เริ่มเซิร์ฟเวอร์

```bash
npm start
```

เปิดเบราว์เซอร์ไปที่:
- หน้าบทเรียนสาธารณะ: http://localhost:3000/index.html
- หน้าเข้าสู่ระบบ:     http://localhost:3000/login.html
- แผง Admin:          http://localhost:3000/admin.html

---

## โครงสร้างโปรเจกต์

```
him-youth-lessons/
├── server.js                 # Backend หลัก (Express)
├── auth-middleware.js        # JWT + bcrypt + middleware
├── package.json
├── .env.example
├── users.json                # ข้อมูลผู้ใช้ (อย่า commit)
├── lessons/
│   ├── manifest.json         # รายการบทเรียน
│   └── pdfs/                 # ไฟล์ PDF
├── scripts/
│   └── reset-admin-password.js
├── index.html                # หน้าดูบทเรียนสาธารณะ
├── login.html                # หน้าเข้าสู่ระบบ
├── admin.html                # แผงผู้ดูแล
├── editor.html               # หน้าแก้ไขบทเรียน
└── SECURITY.md               # รายละเอียดการ harden
```

---

## บทบาทผู้ใช้

| บทบาท   | สิทธิ์ |
|---------|--------|
| **Admin**  | จัดการทุกอย่าง + สร้าง/ลบ Writer |
| **Writer** | สร้าง / แก้ไข / ลบ เฉพาะบทเรียนของตัวเอง |

---

## API สรุป (สำหรับนักพัฒนา)

### สาธารณะ
- `GET /api/lessons` — รายการบทเรียน
- `GET /api/lessons/:id` — รายละเอียดบทเรียน

### ต้องล็อกอิน (ใส่ Header `Authorization: Bearer <token>`)
- `POST /api/auth/login` — เข้าสู่ระบบ
- `GET  /api/auth/me` — ข้อมูลผู้ใช้ปัจจุบัน
- `POST /api/lessons` — สร้างบทเรียนใหม่
- `PUT  /api/lessons/:id` — แก้ไขบทเรียน
- `DELETE /api/lessons/:id` — ลบบทเรียน

### Admin เท่านั้น
- `GET    /api/admin/users`
- `POST   /api/admin/users`
- `PUT    /api/admin/users/:userId`
- `DELETE /api/admin/users/:userId`
- `GET    /api/admin/lessons`

---

## ความปลอดภัยที่ปรับปรุงแล้ว

- ใช้ **bcrypt** เก็บรหัสผ่าน (แทน SHA-256)
- ใช้ **jsonwebtoken** มาตรฐาน
- บังคับใส่ `JWT_SECRET` จาก `.env`
- จำกัด CORS
- บล็อกการเข้าถึง `users.json`, `server.js`, `.env` ฯลฯ
- Rate limiting (Login 10 ครั้ง / 15 นาที)
- Helmet (Security Headers)
- ตรวจสอบไฟล์อัปโหลดเข้มงวด

รายละเอียดเพิ่มเติมดูในไฟล์ [SECURITY.md](SECURITY.md)

---

## คำสั่งที่มีประโยชน์

```bash
# รีเซ็ตรหัสผ่าน Admin
node scripts/reset-admin-password.js "รหัสใหม่"

# รันเซิร์ฟเวอร์
npm start

# ตรวจ dependencies ด้วย Snyk (ถ้าติดตั้งแล้ว)
snyk test
snyk code test
```

---

## ข้อควรระวังตอน Deploy จริง

1. ใช้ **HTTPS** เสมอ (nginx / Caddy / Cloudflare)
2. ตั้งค่า `ALLOWED_ORIGINS` ให้ถูกต้อง
3. อย่า commit ไฟล์ `.env` และ `users.json`
4. อัปเดต package เป็นประจำ (`npm audit`)
5. สำรองข้อมูล `lessons/` และ `users.json` เป็นประจำ

---

## License

MIT
