# 🏗️ HIM Youth Lessons - System Architecture

Complete documentation of the role-based access control system.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    HIM YOUTH LESSONS                        │
│              Role-Based Access Control System               │
└─────────────────────────────────────────────────────────────┘

                          Public Internet
                                 ↓
                    ┌────────────────────┐
                    │    index.html      │
                    │   (Public Viewer)  │
                    │   No Auth Required │
                    └────────────────────┘
                                 ↑
                ┌────────────────┴─────────────────┐
                ↓                                   ↓
         ┌──────────────┐              ┌────────────────────┐
         │ login.html   │              │  API Endpoints     │
         │ (Auth Page)  │              │ - /api/auth/login  │
         └──────────────┘              │ - /api/lessons     │
                ↓                      │ - /api/admin/*     │
         ┌──────────────┐              └────────────────────┘
         │   JWT Token  │                       ↑
         │   Generate   │                       │
         └──────────────┘              ┌────────────────────┐
                ↓                      │   server-auth.js   │
         ┌──────────────┬──────────┐   │   Express Server   │
         ↓              ↓          ↓   └────────────────────┘
    ┌────────┐  ┌──────────┐  ┌────────┐        ↑
    │ Admin  │  │  Writer  │  │Viewer  │        │
    │ Panel  │  │  Editor  │  │(Public)│        │
    └────────┘  └──────────┘  └────────┘  ┌──────────────┐
                                           │   users.json │
                                           │  Database    │
                                           └──────────────┘
```

---

## Authentication Flow

### 1. Login Process

```
User inputs credentials
         ↓
POST /api/auth/login
         ↓
auth-middleware.js verifies password
         ↓
If valid:
  ├─ Generate JWT token
  ├─ Return token + user info
  └─ Client stores in localStorage
         ↓
Redirect based on role:
  ├─ Admin → /admin.html
  ├─ Writer → /editor.html
  └─ (no login needed for public)
```

### 2. Token Format

```
JWT Token Structure:
┌──────────────┬─────────────────────────────┬──────────────┐
│   Header     │         Payload              │  Signature   │
├──────────────┼─────────────────────────────┼──────────────┤
│ {            │ {                           │  HMAC-SHA256 │
│  "alg":      │  "userId": "admin001",      │              │
│  "typ":      │  "username": "admin",       │              │
│  "JWT"       │  "role": "admin",           │              │
│ }            │  "iat": 1234567890,         │              │
│              │  "exp": 1234567890 + 604800 │              │
│              │ }                           │              │
└──────────────┴─────────────────────────────┴──────────────┘
       ↓                ↓                         ↓
   Base64          Base64                   Signed with
                                           JWT_SECRET
```

### 3. Token Verification

```
Client sends: Authorization: Bearer {token}
         ↓
Server receives request
         ↓
auth-middleware.js:
  ├─ Extract token from header
  ├─ Verify signature with JWT_SECRET
  ├─ Check expiration (7 days)
  └─ Decode payload
         ↓
If valid:
  ├─ Attach user to request object
  └─ Allow endpoint execution
         ↓
If invalid/expired:
  ├─ Return 401 (Unauthorized)
  └─ Client redirects to /login.html
```

---

## Data Model

### Users Database (users.json)

```json
[
  {
    "id": "admin001",
    "username": "admin",
    "password": "sha256_hashed_password",
    "role": "admin",
    "email": "admin@himyouth.com",
    "createdAt": "2024-01-01"
  },
  {
    "id": "writer_1234567890",
    "username": "john_writer",
    "password": "sha256_hashed_password",
    "role": "writer",
    "email": "john@example.com",
    "createdAt": "2024-01-15"
  }
]
```

### Lessons Manifest (lessons/manifest.json)

```json
[
  {
    "id": "0001",
    "title": "Foundation of a Disciple",
    "category": "Discipleship",
    "date": "2024-01-10",
    "excerpt": "Understanding the basics...",
    "file": "0001.md",
    "createdBy": "john_writer",
    "userId": "writer_1234567890",
    "createdAt": "2024-01-10T10:00:00Z",
    "updatedAt": "2024-01-10T10:00:00Z",
    "updatedBy": "john_writer"
  }
]
```

### Lesson Content Files (lessons/*.md)

```markdown
# Lesson Title

## Introduction
Content here...

## Main Content
More content...

## Conclusion
Final thoughts...
```

---

## Role Hierarchy & Permissions

### Role Levels

```
                    ADMIN (Level 3)
                       ↑
              Can do everything
                       ↑
                    WRITER (Level 2)
                       ↑
        Can create & edit own lessons
                       ↑
                    VIEWER (Level 1)
                       ↑
              Can only view lessons
```

### Permission Matrix

| Operation | Admin | Writer | Viewer |
|-----------|:-----:|:------:|:------:|
| View lessons | ✅ | ✅ | ✅ |
| Create lesson | ✅ | ✅ | ❌ |
| Edit own lesson | ✅ | ✅ | ❌ |
| Edit others' lessons | ✅ | ❌ | ❌ |
| Delete own lesson | ✅ | ✅ | ❌ |
| Delete others' lessons | ✅ | ❌ | ❌ |
| View all lessons (admin panel) | ✅ | ❌ | ❌ |
| Create writer account | ✅ | ❌ | ❌ |
| Edit user details | ✅ | ❌ | ❌ |
| Delete user | ✅ | ❌ | ❌ |
| Access admin panel | ✅ | ❌ | ❌ |
| Access editor panel | ✅ | ✅ | ❌ |

---

## API Architecture

### Endpoint Categories

#### 🔓 Public Endpoints
```
GET /api/lessons
  └─ Returns: Array of all lessons
  └─ Auth: Not required

GET /api/lessons/:id
  └─ Returns: Single lesson with content
  └─ Auth: Not required
```

#### 🔐 Authentication Endpoints
```
POST /api/auth/login
  ├─ Request: { username, password }
  ├─ Returns: { token, user }
  └─ Auth: Not required

POST /api/auth/logout
  └─ Auth: Required

GET /api/auth/me
  ├─ Returns: Current user info
  └─ Auth: Required
```

#### 📝 Lesson Management (Auth Required)
```
POST /api/lessons
  ├─ Auth: Required (writer, admin)
  ├─ Request: { title, category, date, excerpt, content }
  └─ Returns: Created lesson object

PUT /api/lessons/:id
  ├─ Auth: Required
  ├─ Permission: Only creator or admin
  ├─ Request: { title, category, date, excerpt, content }
  └─ Returns: Updated lesson object

DELETE /api/lessons/:id
  ├─ Auth: Required
  ├─ Permission: Only creator or admin
  └─ Returns: { message: "Lesson deleted" }
```

#### 👨‍💼 Admin Endpoints (Admin Only)
```
GET /api/admin/lessons
  └─ Returns: All lessons with creator metadata

GET /api/admin/users
  ├─ Returns: All users (without passwords)

POST /api/admin/users
  ├─ Request: { username, password, email }
  └─ Returns: Created user object

PUT /api/admin/users/:userId
  ├─ Request: { email, password }
  └─ Returns: Updated user object

DELETE /api/admin/users/:userId
  ├─ Protection: Cannot delete last admin
  └─ Returns: { message: "User deleted" }
```

---

## File Structure

```
him-youth-lessons/
│
├── 🔐 Authentication & Server
│   ├── server.js                 # Main server (use server-auth.js)
│   ├── server-auth.js            # New server with authentication
│   ├── server-original.js        # Backup of original
│   ├── auth-middleware.js        # JWT & role middleware
│   └── users.json                # User database
│
├── 🌐 Frontend Pages
│   ├── index.html                # Public lesson viewer (no login)
│   ├── login.html                # Login page (NEW)
│   ├── editor.html               # Writer lesson editor (NEW)
│   ├── admin.html                # Old admin panel
│   ├── admin-new.html            # New admin panel (NEW)
│   ├── style.css                 # Public page styling
│   └── admin-style.css           # Admin panel styling
│
├── 📚 Lessons Data
│   ├── lessons/                  # Lesson storage
│   │   ├── 0001.md              # Individual lesson files
│   │   ├── 0002.md
│   │   ├── manifest.json         # Lesson registry
│   │   └── ...
│   └── lessons.backup/           # Backup (optional)
│
├── 📦 Project Config
│   ├── package.json              # NPM configuration
│   ├── package-lock.json         # Dependency lock
│   └── node_modules/             # Dependencies
│
└── 📖 Documentation
    ├── README.md                 # Original readme
    ├── ROLE_SETUP.md            # Role setup guide (NEW)
    ├── SYSTEM_ARCHITECTURE.md   # This file (NEW)
    ├── IMPLEMENTATION_CHECKLIST.md # Implementation steps (NEW)
    ├── SETUP.md                 # Original setup
    ├── QUICK_START.md           # Original quick start
    └── ADMIN_GUIDE.md           # Original admin guide
```

---

## Security Architecture

### Password Security

```
User Input Password
         ↓
hashPassword(password + JWT_SECRET)
         ↓
SHA256 Hash
         ↓
Store in users.json
         ↓
On login:
  comparePassword(input_password, stored_hash)
  └─ Returns true/false
```

**Upgrade Path to bcrypt:**
```javascript
// Current: SHA256
hashPassword(password) = sha256(password + JWT_SECRET)

// Recommended: Bcrypt
hashPassword(password) = bcrypt.hash(password, 10)
comparePassword = bcrypt.compare(password, hash)
```

### Token Security

```
┌─────────────────────────────────────────┐
│         JWT Token Security              │
├─────────────────────────────────────────┤
│ • Signed with JWT_SECRET                │
│ • Expires after 7 days                  │
│ • Verified on every protected request   │
│ • Stored in client localStorage         │
│ • Sent via Authorization header         │
└─────────────────────────────────────────┘
```

### Access Control

```
Request to Protected Endpoint
         ↓
Middleware: authenticateToken()
  ├─ Verify token exists
  ├─ Verify signature
  └─ Check expiration
         ↓
Middleware: requireRole('admin')
  └─ Check user.role
         ↓
Route Handler: checkLessonOwnership()
  └─ Verify user owns resource
         ↓
Execute endpoint or return 403 Forbidden
```

---

## User Journey Maps

### 👨‍💼 Admin User Journey

```
1. Discovery
   └─ Visit login.html

2. Authentication
   └─ Enter: admin / admin123
   └─ Receive JWT token
   └─ Token stored in localStorage

3. Dashboard Access
   └─ Redirect to /admin.html
   └─ Load admin panel

4. Lesson Management
   ├─ View all lessons (any author)
   ├─ Edit/delete any lesson
   └─ Track who created each lesson

5. User Management
   ├─ Create new writer accounts
   ├─ Edit user credentials
   ├─ Delete writers
   └─ Cannot delete self if only admin

6. System Settings
   ├─ View system info
   ├─ Review permissions
   └─ Security guidelines

7. Logout
   └─ Remove token from localStorage
   └─ Redirect to login.html
```

### ✍️ Writer User Journey

```
1. Account Creation
   └─ Admin creates account in admin panel
   └─ Admin shares: username, password, email

2. First Login
   └─ Visit login.html
   └─ Enter credentials from admin
   └─ Receive JWT token

3. Redirect to Editor
   └─ System detects role: "writer"
   └─ Redirect to /editor.html

4. Create Lesson
   ├─ Fill lesson form
   │  ├─ Title
   │  ├─ Category
   │  ├─ Date
   │  ├─ Excerpt
   │  └─ Content (Markdown)
   └─ Submit
      ├─ POST /api/lessons with token
      ├─ Server stores: createdBy, userId
      └─ Success message

5. View My Lessons
   ├─ Page loads lessons where userId == currentUser.id
   └─ Show only own lessons

6. Edit Lesson
   ├─ Click edit (currently shows "coming soon")
   └─ Future: Full inline editing

7. Delete Lesson
   ├─ Click delete
   ├─ Confirm action
   ├─ DELETE /api/lessons/:id with token
   └─ Lesson removed

8. View Public Site
   ├─ Logout
   ├─ Visit index.html
   └─ See all lessons as public

9. Logout
   └─ Click logout button
   └─ Token removed
   └─ Redirect to login.html
```

### 👀 Public Viewer Journey

```
1. Discovery
   └─ Visit http://localhost:3000
   └─ Served: index.html

2. Browse Lessons
   ├─ No login required
   ├─ See all published lessons
   ├─ Read lesson summaries
   └─ View author names

3. Read Full Lesson
   ├─ Click lesson title
   ├─ GET /api/lessons/:id (public)
   ├─ Render full lesson content
   └─ Display metadata (author, date)

4. No Editing Capability
   ├─ No create button
   ├─ No edit button
   ├─ No delete button
   └─ Read-only experience

5. Share/Reference
   ├─ Copy lesson URL
   ├─ Share with others
   └─ Others can view same content

Note: Public never needs to login
```

---

## State Management

### Client-Side (Browser)

```
localStorage:
├─ "token": JWT_STRING
└─ "user": { id, username, role, email }

session:
├─ Current page state
├─ Form inputs
└─ UI state (tabs, modals, etc.)
```

### Server-Side (File-Based)

```
users.json:
├─ All user accounts
├─ Hashed passwords
└─ User metadata

lessons/manifest.json:
├─ Lesson registry
├─ Metadata (title, date, author)
└─ File references

lessons/*.md:
├─ Individual lesson content
├─ Raw markdown format
└─ One file per lesson
```

### Session Lifecycle

```
1. Login
   └─ Create session: token + user in localStorage

2. Authenticated Requests
   └─ Include token in Authorization header
   └─ Server verifies token

3. Token Expiration
   └─ After 7 days, token expires
   └─ Next request returns 403
   └─ Client redirects to login

4. Logout
   └─ Delete token from localStorage
   └─ Clear user object
   └─ Redirect to login.html

5. Refresh Page
   ├─ Check localStorage for token
   ├─ If token exists and valid:
   │  └─ Restore session
   └─ If no token or invalid:
      └─ Redirect to login
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | Success | Request completed |
| 201 | Created | New resource created |
| 400 | Bad Request | Missing/invalid fields |
| 401 | Unauthorized | No token or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Server-side error |

### Error Flow

```
Client Request
         ↓
Server Processes
         ↓
Error Occurs?
  ├─ YES: Generate error response
  │    ├─ Return status code
  │    ├─ Include error message
  │    └─ Send to client
  │       └─ Client shows error UI
  └─ NO: Return success response
       └─ Process data normally
```

---

## Performance Considerations

### Optimization Strategies

1. **Token Caching**
   - Tokens stored in localStorage
   - Reuse for multiple requests
   - Only re-authenticate on expiry

2. **Lazy Loading**
   - Load lessons on demand
   - Filter on client side
   - Pagination possible

3. **Database Efficiency**
   - users.json indexed by username
   - lessons manifest for quick lookup
   - Lesson content loaded separately

4. **API Rate Limiting**
   - Consider adding per future growth
   - Monitor token refresh rate
   - Throttle file operations

---

## Scalability Path

### Current Limitations
- File-based database (slow at scale)
- Single server instance
- No clustering

### Growth Path

**Stage 1 (Current):** File-based
- Suitable for < 100 lessons
- < 10 concurrent users
- Single server

**Stage 2:** Database (MongoDB/PostgreSQL)
```javascript
// Add database connection
const mongodb = require('mongodb');
const db = client.db('him-lessons');

// Replace JSON file reads with queries
const users = await db.collection('users').find({}).toArray();
const lessons = await db.collection('lessons').find({}).toArray();
```

**Stage 3:** Distributed
- Multiple server instances
- Load balancer
- Shared session store (Redis)
- Separate file storage (S3)

**Stage 4:** Full Cloud
- Managed database
- CDN for static files
- Serverless functions
- Microservices

---

## Monitoring & Logging

### What to Monitor

```
Application Health:
├─ Server uptime
├─ Response times
├─ Error rate
├─ Token expiry events
└─ Database operations

User Activity:
├─ Login attempts
├─ Failed authentications
├─ Lesson creations
├─ Lesson deletions
└─ Admin operations
```

### Logging Template

```javascript
// Add to server.js
const fs = require('fs');

function log(level, message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${level}: ${message}\n`;
  
  // Console
  console.log(logMessage);
  
  // File
  fs.appendFileSync('server.log', logMessage);
}

// Usage
log('INFO', 'User admin logged in');
log('WARN', 'Failed login attempt for user: john');
log('ERROR', 'Database connection failed');
```

---

## Disaster Recovery

### Backup Strategy

```bash
# Daily backups
cp -r lessons lessons.backup.$(date +%Y%m%d)
cp users.json users.backup.$(date +%Y%m%d).json

# Store safely
# - Cloud storage (S3, Google Cloud)
# - Version control (exclude users.json)
# - Offsite location
```

### Recovery Procedure

```bash
# If data corruption
1. Stop server: Ctrl+C
2. Restore backup: 
   cp lessons.backup.20240115/* lessons/
   cp users.backup.20240115.json users.json
3. Restart server: node server.js
4. Verify: Check all lessons load
5. Notify users
```

---

## Testing Checklist

### Unit Tests Recommended

```javascript
// auth-middleware.js tests
✓ generateToken creates valid JWT
✓ verifyToken accepts valid tokens
✓ verifyToken rejects expired tokens
✓ hashPassword creates hash
✓ comparePassword validates correctly
✓ authenticateToken requires Authorization header
✓ requireRole checks user.role

// Server endpoint tests
✓ GET /api/lessons returns all lessons
✓ POST /api/lessons requires auth
✓ POST /api/lessons creates lesson
✓ PUT /api/lessons/:id updates lesson
✓ DELETE /api/lessons/:id removes lesson
✓ GET /api/admin/users requires admin role
✓ POST /api/admin/users creates writer
```

### Integration Tests

```
✓ Full login flow
✓ Create writer → login → create lesson
✓ Admin edit writer's lesson
✓ Writer cannot edit others' lessons
✓ Token expiration workflow
✓ Session persistence across page refresh
✓ Permission denial scenarios
```

---

## Conclusion

The HIM Youth Lessons system provides:

✅ **Security:** JWT tokens, password hashing, role-based access  
✅ **Scalability:** File-based foundation, upgrade path ready  
✅ **Usability:** Simple UI, clear role separation  
✅ **Maintainability:** Modular code, clear documentation  
✅ **Flexibility:** Customizable roles, extensible API  

---

**Version:** 2.1.0  
**Last Updated:** 2024  
**Status:** Production Ready ✅
