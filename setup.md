# Secure Connect Platform - Setup Guide

## Project Overview

A secure notes + real-time chat API built with:
- **Express.js 5** - REST API server
- **Socket.IO 4** - Real-time WebSocket chat
- **MongoDB + Mongoose** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **RBAC** - Role-based access control (user/admin)

---

## Prerequisites

### Required Software

| Tool | Version | Install Command |
|------|---------|-----------------|
| Node.js | 18+ | `winget install OpenJS.NodeJS` or download from nodejs.org |
| npm | 9+ | Comes with Node.js |
| MongoDB | 6+ | Local: `winget install MongoDB.Server` or use MongoDB Atlas (cloud) |
| Git | Latest | `winget install Git.Git` |

### Verify Installation
```powershell
node --version   # Should show v18+
npm --version    # Should show v9+
mongod --version # If running locally
```

---

## Manual Setup Steps

### 1. Clone/Navigate to Project
```powershell
cd C:\Users\RADHE\Desktop\web_dev3_assignment4
```

### 2. Install Dependencies
```powershell
npm install
```
This installs all packages from `package.json` into `node_modules/`.

### 3. Configure Environment Variables

**Copy the example file:**
```powershell
copy .env.example .env
```

**Edit `.env` with your values:**
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/secure_connect
JWT_SECRET=your-very-long-random-string-here
JWT_EXPIRES_IN=1h
DNS_SERVERS=8.8.8.8,1.1.1.1
```

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/secure_connect` (local) or `mongodb+srv://user:pass@cluster.mongodb.net/dbname` (Atlas) |
| `JWT_SECRET` | **Critical**: Long random string (64+ chars) for signing tokens | Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_EXPIRES_IN` | Token expiration | `1h`, `7d`, `30d` |

#### Optional Variables

| Variable | Description | When Needed |
|----------|-------------|-------------|
| `DNS_SERVERS` | Override Node's DNS resolver for `mongodb+srv://` | Windows where Node uses 127.0.0.1 as DNS (breaks SRV lookups) |

### 4. Start MongoDB

#### Option A: Local MongoDB
```powershell
# Start MongoDB service (if installed as service)
net start MongoDB

# Or run manually
mongod --dbpath C:\data\db
```

#### Option B: MongoDB Atlas (Cloud)
1. Create account at mongodb.com/atlas
2. Create cluster (free M0 tier)
3. Create database user with password
4. Whitelist your IP (or 0.0.0.0/0 for all)
5. Get connection string → update `MONGO_URI` in `.env`

---

## Running the Project

### Development Mode
```powershell
npm start
```
Output:
```
[server] listening on http://localhost:5000
MongoDB connected
```

### Access Points

| Endpoint | Description |
|----------|-------------|
| `http://localhost:5000` | Chat test UI (public/index.html) |
| `http://localhost:5000/api/health` | Health check |
| `http://localhost:5000/api/auth/*` | Auth routes |
| `http://localhost:5000/api/notes/*` | Notes routes (protected) |

---

## API Reference

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/signup` | ❌ | Register new user |
| POST | `/login` | ❌ | Login, returns JWT |
| GET | `/profile` | ✅ | Get current user profile |
| GET | `/admin` | ✅ (admin) | Admin panel test |
| GET | `/users` | ✅ (admin) | List all users |

#### Signup Request
```json
{
  "username": "john",
  "email": "john@example.com",
  "password": "secret123",
  "role": "user"  // optional, defaults to "user"
}
```

#### Login Request
```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

#### Using Token
Include in header: `Authorization: Bearer <token>`

---

### Notes Routes (`/api/notes`) - All Require Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create note |
| GET | `/` | List own notes (admin sees all) |
| GET | `/:id` | Get single note |
| PUT | `/:id` | Update note |
| DELETE | `/:id` | Delete note |

#### Create/Update Note Body
```json
{
  "title": "My Note",
  "content": "Note content here"
}
```

---

### Real-time Chat (Socket.IO)

Connect from frontend:
```javascript
const socket = io({ auth: { token: 'your-jwt-token' } });
```

#### Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `joinRoom` | Client → Server | `{ room: 'general' }` |
| `leaveRoom` | Client → Server | `{ room: 'general' }` |
| `chatMessage` | Client → Server | `{ room: 'general', message: 'Hello' }` |
| `chatMessage` | Server → Client | `{ room, user, message, time }` |
| `systemMessage` | Server → Client | `{ room, message, time }` |

---

## Testing the API

### Using curl

```powershell
# Health check
curl http://localhost:5000/api/health

# Signup
curl -X POST http://localhost:5000/api/auth/signup ^
  -H "Content-Type: application/json" ^
  -d '{"username":"test","email":"test@test.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d '{"email":"test@test.com","password":"password123"}'

# Save token from login response, then:
$env:TOKEN="your-jwt-token-here"

# Profile
curl -H "Authorization: Bearer $env:TOKEN" http://localhost:5000/api/auth/profile

# Create note
curl -X POST -H "Authorization: Bearer $env:TOKEN" -H "Content-Type: application/json" ^
  -d '{"title":"Test","content":"Hello world"}' http://localhost:5000/api/notes

# List notes
curl -H "Authorization: Bearer $env:TOKEN" http://localhost:5000/api/notes
```

### Using the Web UI
1. Open `http://localhost:5000` in browser
2. Sign up with email, password, username
3. Log in → token stored in localStorage
4. Join room "general"
5. Send messages
6. Open second tab, log in as different user, chat

---

## Common Issues & Debugging

### 1. `MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017`
**Cause**: MongoDB not running
**Fix**: Start MongoDB service (`net start MongoDB`) or check Atlas connection string

### 2. `MongoServerSelectionError: querySrv ENODATA` / `getaddrinfo ENOTFOUND`
**Cause**: `mongodb+srv://` DNS lookup failing on Windows
**Fix**: Add to `.env`:
```env
DNS_SERVERS=8.8.8.8,1.1.1.1
```
This is already handled in `config/db.js`

### 3. `[server] JWT_SECRET is missing from .env`
**Cause**: `.env` not loaded or missing JWT_SECRET
**Fix**: 
- Ensure `.env` exists in project root
- Verify `JWT_SECRET` is set
- Restart server after changes

### 4. `EADDRINUSE: address already in use :::5000`
**Cause**: Port 5000 occupied
**Fix**: 
```powershell
# Find and kill process
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change PORT in .env
```

### 5. `Invalid or expired token` on every request
**Causes**:
- Token expired (check `JWT_EXPIRES_IN`)
- `JWT_SECRET` mismatch between login and verification
- Token not sent correctly

**Debug**:
```javascript
// In browser console on the chat page:
localStorage.getItem('token')
// Copy token, decode at jwt.io to verify payload
```

### 6. Socket connection fails with "No token provided"
**Cause**: Token not sent in handshake
**Fix**: Frontend must pass token in `auth`:
```javascript
const socket = io({ auth: { token: localStorage.getItem('token') } });
```

### 7. `ValidationError: User validation failed: username: Path 'username' is required`
**Cause**: Missing required fields in signup
**Fix**: Ensure all fields sent: `username`, `email`, `password`

### 8. `CastError: Invalid _id` on notes routes
**Cause**: Invalid ObjectId format in URL
**Fix**: Use valid MongoDB ObjectId (24 hex chars)

### 9. Admin routes return 403 for admin user
**Cause**: User role not set to 'admin' in database
**Fix**: 
```javascript
// In MongoDB shell:
db.users.updateOne({ email: "admin@test.com" }, { $set: { role: "admin" } })
```
Or signup with `"role": "admin"` (allowed in this demo)

### 10. Notes not showing for admin
**Cause**: `listNotes` filters by `owner` for non-admin
**Fix**: Verify user role is 'admin' in JWT payload:
```javascript
// Decode token at jwt.io, check "role": "admin"
```

---

## Project Structure

```
web_dev3_assignment4/
├── config/
│   └── db.js              # MongoDB connection with DNS fix
├── controllers/
│   ├── authController.js  # Signup, login, profile, admin
│   └── noteController.js  # CRUD for notes with ownership checks
├── events/
│   └── appEvents.js       # EventEmitter for logging events
├── middleware/
│   ├── auth.js            # JWT verification (header + cookie)
│   ├── role.js            # RBAC authorizeRoles()
│   └── errorHandler.js    # Central error handling
├── models/
│   ├── User.js            # User schema (username, email, password, role)
│   └── Note.js            # Note schema (title, content, owner)
├── routes/
│   ├── authRoutes.js      # /api/auth/*
│   └── noteRoutes.js      # /api/notes/*
├── sockets/
│   └── chat.js            # Socket.IO chat with JWT auth
├── public/
│   └── index.html         # Chat test UI
├── .env                   # Environment variables (gitignored)
├── .env.example           # Template for .env
├── .gitignore
├── package.json
├── package-lock.json
└── server.js              # Entry point
```

---

## Security Notes

### Current Implementation (Demo)
- JWT in `Authorization` header **and** cookie
- Passwords hashed with bcrypt (cost 10)
- Role-based access control on routes
- Input validation on all endpoints
- Error messages don't leak stack traces

### Production Hardening (TODO)
- [ ] Use `cookie-parser` with `httpOnly`, `secure`, `sameSite` cookies
- [ ] Add rate limiting (express-rate-limit)
- [ ] Add helmet.js for security headers
- [ ] Use HTTPS only in production
- [ ] Store JWT_SECRET in vault/secrets manager
- [ ] Add refresh token rotation
- [ ] Implement password reset flow
- [ ] Add request validation (zod/joi)
- [ ] Enable MongoDB authentication
- [ ] Add audit logging

---

## Useful Commands

```powershell
# Install deps
npm install

# Start server
npm start

# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Check MongoDB connection
node -e "require('dotenv').config(); require('./config/db')().then(()=>console.log('OK')).catch(e=>console.error(e))"

# View running processes on port 5000
netstat -ano | findstr :5000

# Kill process on port 5000
taskkill /PID <PID> /F
```

---

## Quick Start Checklist

- [ ] Node.js 18+ installed
- [ ] MongoDB running (local or Atlas)
- [ ] `npm install` completed
- [ ] `.env` created from `.env.example`
- [ ] `JWT_SECRET` set to strong random string
- [ ] `MONGO_URI` points to valid database
- [ ] `npm start` shows "MongoDB connected" and "listening on http://localhost:5000"
- [ ] `http://localhost:5000/api/health` returns `{"status":"ok"}`
- [ ] Can signup, login, create notes via API or UI
- [ ] Chat works between two browser tabs