# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

fcopy is a secure clipboard sharing tool that enables text and file synchronization across devices. It's built as a full-stack web application with Vue.js frontend and Node.js/Express backend, featuring real-time updates via Socket.IO and multi-user support with API key authentication.

## Development Commands

### Essential Commands
- `npm start` - Start production server (runs `server/index.js`)
- `npm run dev` - Start development server with nodemon
- `npm run build` - Build frontend using webpack (`client/webpack.config.js`)
- `npm test` - No tests configured (returns error message)

### Docker Commands
- `docker-compose up -d` - Start application in Docker (exposes port 2001)
- `docker build .` - Build Docker image using Dockerfile
- `./deploy.sh` - Interactive deployment script with various options

### Development Workflow
- Frontend builds to `dist/` directory using Webpack 5
- Server serves static files from `dist/` and uploaded files from `uploads/`
- Database is SQLite stored in `uploads/clipboard.db`

## Architecture Overview

### Frontend (Vue 3 + Element Plus)
- **Entry**: `client/src/main.js` - Creates Vue app with Pinia state management
- **Root Component**: `client/src/ClipboardApp.vue` - Main application shell
- **State Management**: Pinia stores in `client/src/stores/` (auth, clipboard, presence, UI, admin)
- **Components**: Organized in `client/src/components/` with feature-specific subfolders
- **Services**: API layer in `client/src/apis/` and socket service in `client/src/core/socket/`
- **Composables**: Reusable logic in `client/src/composables/` (auth, clipboard, upload, etc.)

### Backend (Node.js + Express + Socket.IO)
- **Entry**: `server/index.js` - Main server file with middleware and route setup
- **Config**: `server/config/app.js` - Centralized configuration with environment variables
- **Database**: `server/services/database.js` - SQLite service with user management
- **Routes**: Modular API endpoints in `server/routes/` (clipboard, users, logs, etc.)
- **Middleware**: Authentication and rate limiting in `server/middleware/`
- **Utilities**: Helper functions in `server/utils/` (cleanup, time, IP utils)

### Key Architecture Patterns
- **Multi-user Support**: Each user has isolated data based on API key authentication
- **Real-time Updates**: Socket.IO for live clipboard synchronization
- **File Handling**: Multer for uploads, files served with proper MIME types
- **Security**: API key authentication, rate limiting, input validation
- **Data Isolation**: Users can only access their own clipboard data

## Database Schema

### Tables
- `clipboard` - Stores text content and file metadata with user_id isolation
- `users` - User accounts with api_key, username, is_admin flags
- `access_logs` - Request logging for admin monitoring
- `rate_limits` - IP-based rate limiting records

### Default Users
- Admin user: username `admin`, API key from `ADMIN_API_KEY` env var (default: `admin_secret_key`)
- Default user: username `default`, API key from `CLIPBOARD_API_KEY` env var (default: `default-api-key`)

## Environment Configuration

### Required Environment Variables
```
CLIPBOARD_API_KEY=your-api-key-here      # Default user API key
ADMIN_API_KEY=admin-secret-key           # Admin user API key
PORT=3000                                # Server port (default: 3000, Docker exposes as 2001)
NODE_ENV=production                      # Environment mode
```

### Optional Configuration
```
CLEANUP_DAYS=7                          # Auto-cleanup interval (default: 7 days)
RATE_LIMIT_REQUESTS=10                   # Rate limit per window (default: 10)
RATE_LIMIT_WINDOW_MS=60000              # Rate limit window in ms (default: 1 minute)
RATE_LIMIT_BLOCK_DURATION_MS=600000     # Block duration in ms (default: 10 minutes)
```

## API Endpoints

### Authentication
All API requests require `X-API-Key` header with valid API key.

### Core Endpoints
- `GET /api/clipboard` - Get user's clipboard history
- `POST /api/clipboard/text` - Add text content
- `POST /api/clipboard/file` - Upload file
- `DELETE /api/clipboard/:id` - Delete clipboard item
- `GET /api/clipboard/file/:id` - Download file

### Admin Endpoints (admin API key required)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `GET /api/logs` - Access logs
- `GET /api/active-users` - Active user connections

## Development Notes

### Frontend Development
- Uses Webpack 5 with Vue 3 and Element Plus components
- Composables pattern for reusable logic (authentication, clipboard operations, file upload)
- Pinia for centralized state management
- Socket.IO client for real-time updates

### Backend Development
- Express server with modular route organization
- SQLite database with automatic table creation and migration
- Socket.IO server with authentication middleware
- Automatic cleanup cron job runs daily at 2 AM Shanghai time

### File Upload System
- Files stored in `uploads/` directory
- 10MB size limit (configurable in `server/config/app.js`)
- Supports image preview, PDF viewing, and general file download
- Proper MIME type handling and security headers

### Security Features
- API key-based authentication for all endpoints
- Rate limiting with IP blocking
- CORS and Helmet security middleware
- File upload restrictions and validation
- User data isolation (users can only access their own data)

## Changelog Management

The project maintains a detailed `CHANGELOG.md` file. When making changes:
1. Update `CHANGELOG.md` with new version entry
2. Follow the existing format with clear categorization (新增/修复/改进/优化)
3. Include version number and date
4. Commit changes with descriptive messages in Chinese

## Docker Deployment

The application is containerized with:
- Multi-stage Dockerfile for production builds
- Docker Compose configuration with persistent volumes
- Automatic frontend build during container creation
- Non-root user execution for security
- Data persistence for `uploads/` and database files