# ✅ Implementation Checklist - Role-Based Access Control

Complete this checklist to set up the new role-based authentication system.

---

## Phase 1: Setup (5 minutes)

- [ ] **Copy new files to project directory:**
  ```bash
  cp auth-middleware.js your-project/
  cp server-auth.js your-project/
  ```

- [ ] **Create new HTML pages:**
  ```bash
  cp login.html your-project/
  cp editor.html your-project/
  cp admin-new.html your-project/
  ```

- [ ] **Backup original server:**
  ```bash
  cd your-project
  cp server.js server-original.js
  ```

- [ ] **Activate authentication:**
  ```bash
  cp server-auth.js server.js
  ```

- [ ] **Start server:**
  ```bash
  node server.js
  ```

- [ ] **Verify server output:**
  ```
  ✓ Shows "🚀 HIM Youth Lessons Server running"
  ✓ Shows login URL, admin URL, public lesson URL
  ```

---

## Phase 2: Testing (10 minutes)

### Test 1: Login as Admin

- [ ] Open http://localhost:3000/login.html
- [ ] Login with `admin` / `admin123`
- [ ] Verify redirects to `/admin.html`
- [ ] See admin dashboard with stats

### Test 2: Access Admin Panel

- [ ] View "Lessons" tab - see all lessons
- [ ] View "Manage Users" tab - see user list
- [ ] View "Settings" tab - see permissions info

### Test 3: Create Writer Account

- [ ] In Admin Panel → "Manage Users" tab
- [ ] Fill form:
  - Username: `testwriter`
  - Email: `test@example.com`
  - Password: `testpass123`
- [ ] Click "Create Writer"
- [ ] Verify success message
- [ ] See new user in table

### Test 4: Login as Writer

- [ ] Logout from admin
- [ ] Visit http://localhost:3000/login.html
- [ ] Login with `testwriter` / `testpass123`
- [ ] Verify redirects to `/editor.html`
- [ ] See "My Lesson Editor" interface

### Test 5: Writer Create Lesson

- [ ] In Editor, fill lesson form:
  - Title: "Test Lesson"
  - Category: "Testing"
  - Date: Today
  - Excerpt: "A test lesson"
  - Content: "# Test\nThis is a test lesson."
- [ ] Click "Publish Lesson"
- [ ] See success message
- [ ] See lesson appears in "My Lessons"

### Test 6: Writer Edit/Delete

- [ ] Click "Edit" on lesson (verify edit works or shows "coming soon")
- [ ] Click "Delete" on lesson
- [ ] Confirm deletion
- [ ] Lesson removed from list

### Test 7: Public Access

- [ ] Logout
- [ ] Clear browser cache
- [ ] Open http://localhost:3000/index.html
- [ ] Verify can view lessons WITHOUT login
- [ ] Verify no create/edit buttons

### Test 8: Permission Restrictions

- [ ] Login as `testwriter`
- [ ] Try to access `/admin.html` directly
- [ ] Verify redirected to `/editor.html`
- [ ] Confirm cannot see admin controls

---

## Phase 3: Production Preparation (20 minutes)

### Security Configuration

- [ ] **Change default admin password:**
  1. Login as admin
  2. Go to "Manage Users" tab
  3. Click Edit on admin account
  4. Enter new secure password
  5. Save changes

  OR manually update `users.json` if using bcrypt

- [ ] **Set environment variable for JWT_SECRET:**
  ```bash
  # Linux/Mac
  export JWT_SECRET="your-very-secure-random-string-minimum-32-characters"
  node server.js
  
  # Windows
  set JWT_SECRET=your-very-secure-random-string-minimum-32-characters
  node server.js
  ```

- [ ] **Create .gitignore to protect sensitive files:**
  ```
  users.json
  .env
  node_modules/
  *.log
  ```

- [ ] **Optional: Install bcrypt for better password hashing:**
  ```bash
  npm install bcryptjs
  ```
  Then update `hashPassword` and `comparePassword` functions in `auth-middleware.js`

### File Organization

- [ ] Organize lesson files (keep manifest.json structure)
- [ ] Backup original users.json
- [ ] Set file permissions:
  ```bash
  chmod 600 users.json      # Read/write for owner only
  chmod 644 *.html *.js     # Read for all, write for owner
  ```

### URLs Setup

- [ ] Verify all URLs work:
  - [ ] http://localhost:3000/ → public lessons
  - [ ] http://localhost:3000/index.html → public lessons
  - [ ] http://localhost:3000/login.html → login
  - [ ] http://localhost:3000/editor.html → writer area (requires login)
  - [ ] http://localhost:3000/admin.html → admin area (requires admin login)

### Test Production Scenarios

- [ ] Multiple writers create lessons
- [ ] Admin edits writer's lesson
- [ ] Writer tries to edit others' lessons (fails)
- [ ] Logout and token cleanup
- [ ] Session timeout after 7 days (test by modifying token)

---

## Phase 4: Deployment

### For Hosting (Heroku, Railway, etc.)

- [ ] Update PORT handling:
  ```javascript
  const PORT = process.env.PORT || 3000;
  ```

- [ ] Use HTTPS in production URLs

- [ ] Set environment variables on hosting platform:
  ```
  JWT_SECRET = your-secret-key-here
  NODE_ENV = production
  ```

- [ ] Test on production URL

### For Docker Deployment

- [ ] Create Dockerfile:
  ```dockerfile
  FROM node:16
  WORKDIR /app
  COPY package*.json ./
  RUN npm install
  COPY . .
  ENV JWT_SECRET=your-secure-key
  EXPOSE 3000
  CMD ["node", "server.js"]
  ```

- [ ] Build and test: `docker build -t him-lessons .`

---

## Phase 5: User Management Workflows

### Creating Writer Accounts (Admin)

**Workflow:**
1. Admin logs in → Admin Panel
2. Manage Users tab → Create New Writer Account form
3. Fill in: username, email, password
4. Click "Create Writer"
5. Share credentials with writer

### Writer First Login

**Workflow:**
1. Writer visits login.html
2. Enters credentials from admin
3. Taken to editor.html
4. Can create first lesson

### Resetting Writer Password (Admin)

**Workflow:**
1. Admin → Manage Users → Find writer
2. Click Edit
3. Enter new password
4. Save
5. Share new password with writer

### Removing Writer (Admin)

**Workflow:**
1. Admin → Manage Users
2. Find writer to remove
3. Click Delete
4. Confirm
5. Writer account deleted

---

## Phase 6: Verification Checklist

### Final Checks

- [ ] All three roles work correctly:
  - [ ] Admin: Can access everything
  - [ ] Writer: Can only edit own lessons
  - [ ] Public: Can view without login

- [ ] API endpoints respond correctly:
  ```bash
  # Public
  curl http://localhost:3000/api/lessons
  
  # Auth required (replace TOKEN with real token)
  curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/auth/me
  ```

- [ ] Database integrity:
  - [ ] users.json exists and is valid JSON
  - [ ] lessons/manifest.json tracks all lessons
  - [ ] All lesson .md files present

- [ ] Error handling:
  - [ ] Invalid login shows error
  - [ ] Expired token redirects to login
  - [ ] Wrong role shows permission error

- [ ] Performance:
  - [ ] Page load time acceptable
  - [ ] No console errors
  - [ ] Database queries fast

---

## Troubleshooting Quick Reference

| Problem | Solution |
|---------|----------|
| Login fails | Check users.json exists, verify credentials, restart server |
| Can't create writer | Ensure logged in as admin, check all fields filled, unique username |
| Pages won't load | Check server running, CORS enabled, correct URLs |
| Token errors | Clear browser cache, delete localStorage, login again |
| Lessons not showing | Check manifest.json valid, lesson .md files exist |
| Admin.html won't load | Ensure using admin-new.html or admin.html, check auth header |

---

## Documentation References

- **Full Setup Guide:** ROLE_SETUP.md
- **API Documentation:** Check server-auth.js comments
- **Original Features:** README.md

---

## Rollback Plan

If you need to revert to the original system:

```bash
# Restore original server
cp server-original.js server.js

# Comment out or remove:
# - auth-middleware.js references
# - login.html/editor.html/admin-new.html
# - users.json

# Restart
node server.js
```

---

## Support & Notes

- **Default Admin:** username: `admin`, password: `admin123`
- **Token Duration:** 7 days
- **Password Hashing:** SHA256 (consider upgrading to bcrypt)
- **Session Storage:** localStorage (browser-based)

---

**Setup Time Estimate:** 45 minutes total  
**Difficulty Level:** Medium  
**Version:** 2.1.0

✅ Once all items are checked, your system is ready for production use!
