# 📖 Literati API Documentation

Complete API reference for the Literati Digital Library backend services.

## 🌐 **API Overview**

The Literati API consists of **three main services**:

| Service | Base URL | Purpose |
|---------|----------|---------|
| **Backend API** | `https://library-server-m6gr.onrender.com` | Main application API |
| **AI Service** | `https://literati-ai-production.onrender.com` | AI-powered features |
| **Database** | Supabase | Direct database operations |

### **API Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client        │────│   Backend API   │────│   AI Service    │
│   (Frontend)    │    │   (Express.js)  │    │   (FastAPI)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │   Supabase Database   │
                    │   (PostgreSQL + Auth) │
                    └───────────────────────┘
```

## 🔐 **Authentication**

### **Authentication Flow**
Literati uses **JWT-based authentication** with refresh token rotation:

1. **Login** → Receive access token (15min) + refresh token (7 days)
2. **API calls** → Include `Authorization: Bearer <access_token>`
3. **Token refresh** → Exchange refresh token for new access token
4. **Logout** → Invalidate all tokens

### **Security Features**
- ✅ **Token blacklisting** for instant revocation
- ✅ **Token family tracking** prevents replay attacks
- ✅ **Device fingerprinting** for additional security
- ✅ **Account lockout** after failed attempts
- ✅ **Rate limiting** on authentication endpoints

## 🔑 **Authentication Endpoints**

### **POST /auth/signup**
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "username": "john_doe"
}
```

**Validation Rules:**
- **Email**: Valid format, normalized
- **Password**: 8-128 characters, must contain uppercase, lowercase, and number
- **Username**: 3-30 characters, alphanumeric + underscore/hyphen

**Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "id": "uuid-v4",
    "email": "user@example.com",
    "username": "john_doe",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

**Error Responses:**
```json
// 400 - Validation Error
{
  "error": "Validation failed",
  "details": [
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter",
      "value": "weakpass"
    }
  ]
}

// 409 - User Already Exists
{
  "error": "User already exists",
  "field": "email"
}
```

---

### **POST /auth/login**
Authenticate user and receive tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "uuid-v4",
    "email": "user@example.com",
    "username": "john_doe",
    "avatar_url": null
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

**Security Features:**
- Refresh token stored in **httpOnly cookie**
- **Rate limited**: 5 attempts per 15 minutes
- **Account lockout**: 5 failed attempts = 15 minute lockout
- **Fingerprinting**: Device-specific tokens

**Error Responses:**
```json
// 401 - Invalid Credentials
{
  "error": "Invalid email or password"
}

// 423 - Account Locked
{
  "error": "Account temporarily locked due to too many failed attempts",
  "lockoutRemaining": 845000,
  "retryAfter": "14 minutes"
}

// 429 - Rate Limited
{
  "error": "Too many authentication attempts, please try again later",
  "retryAfter": "15 minutes"
}
```

---

### **POST /auth/refresh**
Exchange refresh token for new access token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900
}
```

**Security Features:**
- **Token rotation**: New refresh token issued
- **Family tracking**: Detects token theft
- **Fingerprint validation**: Must match original device

---

### **POST /auth/logout**
Invalidate user tokens and end session.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Security Features:**
- **Blacklists** current access token
- **Invalidates** entire token family
- **Clears** httpOnly refresh cookie

## 📚 **Books API**

### **GET /books**
Retrieve user's book collection with filtering and pagination.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
```
?limit=50&offset=0&status=reading&genre=fiction&orderBy=created_at&orderDirection=desc
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 50 | Number of books per page (max 100) |
| `offset` | integer | 0 | Number of books to skip |
| `status` | string | null | Filter by reading status |
| `genre` | string | null | Filter by genre |
| `orderBy` | string | created_at | Sort field (title, author, created_at) |
| `orderDirection` | string | desc | Sort direction (asc, desc) |

**Response (200):**
```json
{
  "books": [
    {
      "id": "uuid-v4",
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "isbn": "9780743273565",
      "description": "A classic American novel...",
      "genre": "fiction",
      "cover_url": "https://covers.example.com/gatsby.jpg",
      "file_path": "books/user-id/gatsby.pdf",
      "file_size": 2048576,
      "reading_status": "reading",
      "page_count": 180,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "_total": 1,
  "_performance": {
    "queryTime": "45ms",
    "cacheHit": true
  }
}
```

**Performance Features:**
- ✅ **Optimized queries** with database optimizer
- ✅ **Advanced caching** for frequently accessed books
- ✅ **Background cover fetching** doesn't block response
- ✅ **Pagination** prevents large result sets

---

### **GET /books/:id**
Retrieve a specific book by ID.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Parameters:**
- `id` (UUID): Book identifier

**Response (200):**
```json
{
  "id": "uuid-v4",
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "isbn": "9780743273565",
  "description": "A classic American novel...",
  "genre": "fiction",
  "cover_url": "https://covers.example.com/gatsby.jpg",
  "file_path": "books/user-id/gatsby.pdf",
  "file_size": 2048576,
  "reading_status": "reading",
  "current_page": 45,
  "page_count": 180,
  "notes_count": 5,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
```json
// 404 - Book Not Found
{
  "error": "Book not found"
}
```

---

### **POST /books**
Add a new book to the library.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "isbn": "9780743273565",
  "description": "A classic American novel...",
  "genre": "fiction",
  "publishedYear": 1925,
  "pageCount": 180,
  "language": "en"
}
```

**Validation Rules:**
- **title**: Required, 1-200 characters
- **author**: Required, 1-200 characters
- **isbn**: Optional, valid ISBN-10 or ISBN-13
- **description**: Optional, max 2000 characters
- **genre**: Optional, max 100 characters
- **publishedYear**: Optional, 1000 - current year
- **pageCount**: Optional, positive integer
- **language**: Optional, 2-letter ISO code

**Response (201):**
```json
{
  "success": true,
  "book": {
    "id": "uuid-v4",
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "9780743273565",
    "description": "A classic American novel...",
    "genre": "fiction",
    "cover_url": null,
    "reading_status": "not_started",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "Book added successfully"
}
```

**Security Features:**
- ✅ **Rate limited**: 20 requests per hour
- ✅ **Input validation** with express-validator
- ✅ **XSS protection** via sanitization
- ✅ **Content hash** prevents duplicate uploads

---

### **PUT /books/:id**
Update an existing book.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "reading_status": "completed",
  "current_page": 180
}
```

**Response (200):**
```json
{
  "success": true,
  "book": {
    "id": "uuid-v4",
    "title": "Updated Title",
    "reading_status": "completed",
    "current_page": 180,
    "updated_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "Book updated successfully"
}
```

---

### **POST /books/:id/upload**
Upload book file (PDF or EPUB).

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `bookFile`: File (PDF or EPUB, max 50MB)

**Security Features:**
- ✅ **File type validation**: Only PDF and EPUB allowed
- ✅ **Size limits**: 50MB maximum
- ✅ **Magic number verification**: Files must match declared types
- ✅ **Virus scanning**: Integrated with security pipeline
- ✅ **Rate limiting**: 20 uploads per hour per IP

**Response (200):**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "file": {
    "path": "books/user-id/book-uuid-timestamp.pdf",
    "size": 2048576,
    "type": "application/pdf",
    "name": "original-filename.pdf"
  }
}
```

**Error Responses:**
```json
// 400 - Invalid File Type
{
  "error": "Unsupported file type",
  "allowed": ["PDF", "EPUB"]
}

// 413 - File Too Large
{
  "error": "File too large",
  "limit": "50MB"
}
```

## 📝 **Notes API**

### **GET /notes**
Retrieve user's notes with filtering.

**Query Parameters:**
```
?bookId=uuid&limit=50&offset=0&orderBy=created_at&search=keyword
```

**Response (200):**
```json
{
  "notes": [
    {
      "id": "uuid-v4",
      "book_id": "uuid-v4",
      "content": "This is an important passage about...",
      "page_number": 45,
      "chapter": "Chapter 3",
      "is_private": false,
      "ai_summary": "Brief summary of the note content...",
      "tags": ["important", "theme"],
      "created_at": "2024-01-01T00:00:00.000Z",
      "book": {
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald"
      }
    }
  ]
}
```

---

### **POST /notes**
Create a new note.

**Request Body:**
```json
{
  "bookId": "uuid-v4",
  "content": "This is an important passage about symbolism...",
  "pageNumber": 45,
  "chapter": "Chapter 3",
  "isPrivate": false,
  "tags": ["symbolism", "analysis"]
}
```

**Response (201):**
```json
{
  "success": true,
  "note": {
    "id": "uuid-v4",
    "book_id": "uuid-v4",
    "content": "This is an important passage about symbolism...",
    "page_number": 45,
    "chapter": "Chapter 3",
    "is_private": false,
    "tags": ["symbolism", "analysis"],
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### **POST /notes/:id/summarize**
Generate AI summary for a note.

**Request Body:**
```json
{
  "summaryType": "brief"
}
```

**Response (200):**
```json
{
  "success": true,
  "summary": "This note discusses the symbolism of the green light in The Great Gatsby, representing hope and the American Dream.",
  "summaryType": "brief",
  "generatedAt": "2024-01-01T00:00:00.000Z"
}
```

## 📊 **Reading Sessions API**

### **POST /reading/start**
Start a new reading session.

**Request Body:**
```json
{
  "bookId": "uuid-v4",
  "startPage": 45,
  "location": "Chapter 3"
}
```

**Response (201):**
```json
{
  "success": true,
  "session": {
    "id": "uuid-v4",
    "book_id": "uuid-v4",
    "start_time": "2024-01-01T00:00:00.000Z",
    "start_page": 45,
    "location": "Chapter 3",
    "status": "active"
  }
}
```

---

### **PUT /reading/:sessionId**
Update active reading session.

**Request Body:**
```json
{
  "currentPage": 50,
  "notesAdded": 2,
  "breakDuration": 300
}
```

---

### **POST /reading/:sessionId/end**
End a reading session.

**Request Body:**
```json
{
  "endPage": 55,
  "totalPages": 10,
  "sessionNotes": "Great reading session, very engaging chapter"
}
```

**Response (200):**
```json
{
  "success": true,
  "session": {
    "id": "uuid-v4",
    "duration_minutes": 45,
    "pages_read": 10,
    "notes_count": 2,
    "end_time": "2024-01-01T00:45:00.000Z",
    "status": "completed"
  }
}
```

## 🎮 **Gamification API**

### **GET /gamification/achievements**
Get user's achievements and progress.

**Response (200):**
```json
{
  "achievements": [
    {
      "id": "first_book",
      "title": "First Book",
      "description": "Add your first book to the library",
      "icon": "📚",
      "earned": true,
      "earned_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "stats": {
    "totalBooks": 25,
    "totalReadingTime": 1440,
    "totalNotes": 150,
    "currentStreak": 7
  }
}
```

---

### **POST /gamification/goals**
Create a reading goal.

**Request Body:**
```json
{
  "type": "daily_pages",
  "target": 20,
  "description": "Read 20 pages every day",
  "deadline": "2024-12-31T23:59:59.000Z"
}
```

**Response (201):**
```json
{
  "success": true,
  "goal": {
    "id": "uuid-v4",
    "type": "daily_pages",
    "target": 20,
    "current_progress": 0,
    "description": "Read 20 pages every day",
    "deadline": "2024-12-31T23:59:59.000Z",
    "status": "active",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

## 🤖 **AI Service API**

### **Base URL**
```
https://literati-ai-production.onrender.com
```

### **POST /summarize-note**
Generate AI summary for note content.

**Request Body:**
```json
{
  "content": "This is a detailed note about the symbolism in The Great Gatsby...",
  "summaryType": "brief",
  "maxLength": 200
}
```

**Response (200):**
```json
{
  "summary": "This note analyzes the green light symbolism in Gatsby, representing hope and the American Dream's unattainability.",
  "originalLength": 450,
  "summaryLength": 95,
  "summaryType": "brief",
  "generatedAt": "2024-01-01T00:00:00.000Z",
  "model": "gemini-2.0-flash"
}
```

### **GET /health**
AI service health check.

**Response (200):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "model": "gemini-2.0-flash",
  "uptime": 3600,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### **GET /docs**
Auto-generated API documentation (Swagger UI).

## 🚨 **Error Handling**

### **Standard Error Format**
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional details",
  "requestId": "req_uuid-v4",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### **HTTP Status Codes**
| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful request |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 413 | Payload Too Large | File too large |
| 422 | Unprocessable Entity | Validation failed |
| 423 | Locked | Account locked |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

## ⚡ **Rate Limits**

| Endpoint Category | Limit | Window |
|------------------|-------|---------|
| **General API** | 100 requests | 15 minutes |
| **Authentication** | 5 requests | 15 minutes |
| **File Uploads** | 20 requests | 1 hour |
| **Gamification** | 50 requests | 5 minutes |

### **Rate Limit Headers**
```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1640995200
RateLimit-Policy: 100;w=900
```

## 🔐 **Security Features**

### **Request Security**
- ✅ **HTTPS only** in production
- ✅ **CORS** configured for allowed origins
- ✅ **Helmet** security headers
- ✅ **Input sanitization** and validation
- ✅ **SQL injection** prevention
- ✅ **XSS protection**

### **Authentication Security**
- ✅ **JWT tokens** with rotation
- ✅ **Refresh token families**
- ✅ **Device fingerprinting**
- ✅ **Account lockout** protection
- ✅ **Token blacklisting**

### **File Upload Security**
- ✅ **File type validation**
- ✅ **Size limits**
- ✅ **Magic number verification**
- ✅ **Virus scanning integration**
- ✅ **Secure storage** paths

## 📊 **API Testing**

### **Health Check Endpoints**
```bash
# Backend API Health
curl https://library-server-m6gr.onrender.com/health

# AI Service Health
curl https://literati-ai-production.onrender.com/health

# Database Connection Test
curl https://library-server-m6gr.onrender.com/debug/db-connection
```

### **Authentication Test**
```bash
# Login
curl -X POST https://library-server-m6gr.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123"}'

# Use token for authenticated requests
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://library-server-m6gr.onrender.com/books
```

### **Rate Limit Testing**
```bash
# Test rate limits (should hit limit after 100 requests)
for i in {1..105}; do
  curl -s https://library-server-m6gr.onrender.com/health
done
```

## 🔧 **SDKs and Client Libraries**

### **JavaScript/TypeScript Client**
```javascript
// Example API client usage
const LiteratiAPI = {
  baseURL: 'https://library-server-m6gr.onrender.com',

  async login(email, password) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  },

  async getBooks(token, options = {}) {
    const params = new URLSearchParams(options);
    const response = await fetch(`${this.baseURL}/books?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }
};
```

### **Python Client**
```python
# Example Python client
import requests

class LiteratiAPI:
    def __init__(self, base_url='https://library-server-m6gr.onrender.com'):
        self.base_url = base_url
        self.token = None

    def login(self, email, password):
        response = requests.post(f'{self.base_url}/auth/login',
                               json={'email': email, 'password': password})
        if response.ok:
            self.token = response.json()['tokens']['accessToken']
        return response.json()

    def get_books(self, **params):
        headers = {'Authorization': f'Bearer {self.token}'}
        response = requests.get(f'{self.base_url}/books',
                              headers=headers, params=params)
        return response.json()
```

---

## 📚 **Next Steps**

For implementation details, see:
- [Environment Setup](./ENVIRONMENT_SETUP.md) - Development environment configuration
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment instructions
- [Security Documentation](../server2/SECURITY_DOCUMENTATION.md) - Security implementation details

**Your Literati API is production-ready with enterprise-grade security and comprehensive documentation!** 🚀