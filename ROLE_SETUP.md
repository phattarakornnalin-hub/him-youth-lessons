# 🔐 HIM Youth Lessons - Role-Based Access Control Setup Guide

## Overview

This lesson management system now includes a comprehensive **role-based access control (RBAC)** system with three distinct user roles:

- **👤 Admin**: Full system access, user management, lesson management
- **✍️ Writer/Editor**: Create and edit own lessons only
- **👀 Viewer**: Public access, no login required

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Setup Instructions](#setup-instructions)
4. [Using the System](#using-the-system)
5. [Security Notes](#security-notes)

---

## Quick Start

### 1. Switch to New Server (with Authentication)

Replace your current server with the new authentication-enabled server:

```bash
# Backup original server
cp server.js server-original.js

# Use the new authenticated server
cp server-auth.js server.js

# Restart the server
node server.js
```

### 2. Default Admin Credentials

```
Username: admin
Password: admin123
```

⚠️ **Change this immediately in production!**

### 3. Access Points

| Role | URL | Purpose |
|------|-----|---------|
| Public | `/index.html` | View all published lessons (no login) |
| Admin | `/admin.html` | Full system management & user control |
| Writer | `/editor.html` | Create and edit own lessons |
| Anyone | `/login.html` | Login page |

---

## User Roles & Permissions

### 📊 Permission Matrix

| Action | Admin | Writer | Viewer |
|--------|-------|--------|--------|
| **View Lessons** | ✅ | ✅ | ✅ |
| **Create Lesson** | ✅ | ✅ | ❌ |
| **Edit Own Lesson** | ✅ | ✅ | ❌ |
| **Edit Any Lesson** | ✅ | ❌ | ❌ |
| **Delete Any Lesson** | ✅ | ❌ | ❌ |
| **Delete Own Lesson** | ✅ | ✅ | ❌ |
| **Create Writer** | ✅ | ❌ | ❌ |
| **Manage Users** | ✅ | ❌ | ❌ |
| **Access Admin Panel** | ✅ | ❌ | ❌ |
| **Access Editor Panel** | ✅ | ✅ | ❌ |

---

## Setup Instructions

### Step 1: Copy New Files

Copy these new files to your project directory:

```
├── auth-middleware.js      # Authentication & authorization logic
├── server-auth.js          # New server with auth endpoints
├── login.html              # Login page
├── editor.html             # Writer/Editor lesson management
├── admin-new.html          # New admin panel with user management
├── users.json              # User database (auto-created)
└── ROLE_SETUP.md          # This file
```

### Step 2: Update package.json (Optional)

If you want to use bcrypt for better password hashing (recommended for production):

```bash
npm install bcryptjs
```

Then update `auth-middleware.js` to use bcrypt:

```javascript
const bcrypt = require('bcryptjs');

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}
```

### Step 3: Initialize Server with Auth

Replace your `server.js`:

```bash
cp server-auth.js server.js
node server.js
```

You should see:
```
🚀 HIM Youth Lessons Server running on http://localhost:3000
🔐 Login: http://localhost:3000/login.html
👨‍💼 Admin Panel: http://localhost:3000/admin.html
📚 Public Lessons: http://localhost:3000/index.html
```

### Step 4: Login as Admin

1. Go to http://localhost:3000/login.html
2. Login with: `admin` / `admin123`
3. You'll be redirected to `/admin.html`

---

## Using the System

### 👀 Public Users (Viewers)

**Access:** http://localhost:3000/index.html

- View all published lessons
- No login required
- Cannot create, edit, or delete lessons

### ✍️ Writers/Editors

**Access:** http://localhost:3000/editor.html

#### How to login as a writer:
1. Admin must create writer account in Admin Panel → Manage Users
2. Writer visits http://localhost:3000/login.html
3. Enter username and password
4. Redirected to `/editor.html`

#### Writer capabilities:
- ✅ Create new lessons
- ✅ Edit own lessons
- ✅ Delete own lessons
- ❌ Edit other writers' lessons
- ❌ Manage users or system

### 👨‍💼 Admins

**Access:** http://localhost:3000/admin.html

#### Dashboard Tabs:

**1. 📚 Lessons Tab**
- View all lessons from all writers
- Edit any lesson
- Delete any lesson
- See creation metadata (who created it, when)

**2. 👥 Manage Users Tab**
- Create new writer accounts
- View all users and their roles
- Edit user email and password
- Delete writer accounts (cannot delete last admin)
- View user creation dates

**3. ⚙️ Settings Tab**
- System information
- Security notes
- Permission summary reference

#### Admin workflow:

```
1. Login to Admin Panel (admin.html)
   ↓
2. Go to "Manage Users" tab
   ↓
3. Fill in new writer details:
   - Username: john_writer
   - Email: john@example.com
   - Password: secure_password_here
   ↓
4. Click "Create Writer"
   ↓
5. Share credentials with the writer
6. Writer can now login at login.html → editor.html
```

---

## API Endpoints

### Public Endpoints (No Auth Required)

```bash
# Get all lessons
GET /api/lessons

# Get single lesson
GET /api/lessons/:id
```

### Authentication Endpoints

```bash
# Login
POST /api/auth/login
Body: { username, password }
Returns: { token, user }

# Logout
POST /api/auth/logout
Header: Authorization: Bearer {token}

# Get current user
GET /api/auth/me
Header: Authorization: Bearer {token}
```

### Protected Endpoints (Auth + Role Required)

```bash
# Create lesson (writer, admin)
POST /api/lessons
Header: Authorization: Bearer {token}
Body: { title, category, date, excerpt, content }

# Update lesson (only creator or admin)
PUT /api/lessons/:id
Header: Authorization: Bearer {token}
Body: { title, category, date, excerpt, content }

# Delete lesson (only creator or admin)
DELETE /api/lessons/:id
Header: Authorization: Bearer {token}
```

### Admin Endpoints (Admin Only)

```bash
# Get all lessons with creator info
GET /api/admin/lessons
Header: Authorization: Bearer {token}

# Get all users
GET /api/admin/users
Header: Authorization: Bearer {token}

# Create writer
POST /api/admin/users
Header: Authorization: Bearer {token}
Body: { username, email, password }

# Update user
PUT /api/admin/users/:userId
Header: Authorization: Bearer {token}
Body: { email, password }

# Delete user
DELETE /api/admin/users/:userId
Header: Authorization: Bearer {token}
```

---

## Security Notes

### ⚠️ Important for Production

1. **Change Admin Password**
   ```javascript
   // In users.json, update the admin password using a secure hash
   // Or use the admin panel to update it
   ```

2. **Set JWT Secret**
   ```bash
   export JWT_SECRET="your-very-secure-random-string-here"
   node server.js
   ```

3. **Use HTTPS**
   - Always use HTTPS in production
   - Never send passwords over HTTP

4. **Use bcrypt for passwords** (install recommended)
   ```bash
   npm install bcryptjs
   ```

5. **Database Security**
   - `users.json` stores user data
   - Use `.gitignore` to prevent committing sensitive data
   - Add to `.gitignore`:
     ```
     users.json
     .env
     node_modules/
     ```

6. **Token Expiration**
   - Tokens expire after 7 days (configured in auth-middleware.js)
   - Adjust as needed: `exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)`

7. **Password Policy**
   - Enforce strong passwords in production
   - Admin should require password changes on first login

### 🔒 File Permissions

Restrict access to sensitive files:

```bash
# Make users.json readable only by owner
chmod 600 users.json

# Make server accessible but not modifiable
chmod 644 server.js auth-middleware.js
```

---

## File Structure

```
him-youth-lessons/
├── server.js              # Main server (switch from old version)
├── server-auth.js         # New server with auth (copy to server.js)
├── auth-middleware.js     # Authentication module
├── users.json             # User database (auto-created)
│
├── index.html             # Public lesson viewer
├── login.html             # Login page (NEW)
├── editor.html            # Writer/editor panel (NEW)
├── admin.html             # Admin panel (updated)
├── admin-new.html         # Better admin panel (NEW)
│
├── lessons/               # Lesson files (.md)
│   ├── 0001.md
│   ├── 0002.md
│   ├── manifest.json
│   └── ...
│
├── style.css              # Public styling
├── admin-style.css        # Admin styling
├── package.json
└── ROLE_SETUP.md         # This guide
```

---

## Troubleshooting

### Login not working

1. Check server is running: `node server.js`
2. Check users.json exists
3. Verify credentials in users.json
4. Check browser console for errors

### Can't create writer account

1. Ensure you're logged in as admin
2. Check all fields are filled
3. Username must be unique
4. Password must be set

### Token expired

1. Browser token expires after 7 days
2. User needs to login again
3. Tokens auto-expire on logout

### Writer can't edit others' lessons

This is by design - only admins can edit other writers' lessons. Writers can only:
- Create new lessons
- Edit their own lessons
- Delete their own lessons

---

## Migration from Old System

If migrating from the non-authenticated system:

1. Backup lessons folder:
   ```bash
   cp -r lessons lessons.backup
   ```

2. Replace server.js:
   ```bash
   cp server-auth.js server.js
   ```

3. All existing lessons will still be accessible

4. Create admin account first, then writers

5. Old lessons won't have creator info (shows as "Unknown")
   - This is okay, admin can still edit them

---

## Support

For issues or questions:

1. Check console errors (F12)
2. Verify server logs
3. Check API endpoints with curl:
   ```bash
   curl http://localhost:3000/api/lessons
   ```
4. Review the troubleshooting section above

---

## Summary

✅ **What's New:**
- User authentication with JWT
- Three-tier role system (Admin, Writer, Viewer)
- User management for admins
- Lesson ownership tracking
- Secure password handling
- Token-based session management

✅ **Benefits:**
- Only admins can create writer accounts
- Writers can only edit their own lessons
- Public can view without login
- Audit trail of who created/edited lessons
- Scalable for multiple writers

---

**Version:** 2.1.0  
**Last Updated:** 2024  
**Status:** Production Ready ✅
