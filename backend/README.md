# Content Approval System - Backend API

This is the backend API for the Content Approval System, built with NestJS, TypeORM, and PostgreSQL.

## Features

- **Google OAuth Authentication** with domain restrictions
- **Role-based Authorization** (Admin, Writer, Approver)
- **Complex Approval Workflow** with CEO, COO, CMO approval process
- **Version History** for all content changes
- **Comprehensive Audit Logging** 
- **Real-time Notifications** with user preferences
- **File Upload Support** for card assets
- **RESTful API** with Swagger documentation

## Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Google OAuth credentials

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Configuration:**
   ```bash
   cp .env.example .env
   ```
   
   Update the following variables in `.env`:
   ```env
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=your_password
   DB_DATABASE=content_approval

   # JWT
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d

   # Google OAuth
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

   # Application
   NODE_ENV=development
   PORT=3000
   FRONTEND_URL=http://localhost:5173
   ALLOWED_DOMAIN=yourcompany.com
   ```

3. **Database Setup:**
   ```bash
   # Create database
   createdb content_approval

   # Run migrations (if using production)
   npm run migration:run
   ```

## Development

```bash
# Start development server
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod
```

## API Documentation

Once running, visit:
- **Swagger Documentation:** http://localhost:3000/api/docs
- **Health Check:** http://localhost:3000/health

## Architecture Overview

### Core Entities

#### Users
- **UserRole:** `ADMIN`, `WRITER`, `APPROVER`
- **ApproverRole:** `CEO`, `COO`, `CMO`
- **Notification Preferences:** Configurable per user

#### Posts & Content
- **Post:** Main content container with status workflow
- **Card:** Individual content pieces within posts
- **CardVersion:** Version history for all card changes
- **Tags & Releases:** Organization structures

#### Approval Workflow
- **Approval:** Individual approver decisions
- **Post Status:** `DRAFT`, `IN_APPROVAL`, `NEEDS_ADJUSTMENT`, `APPROVED`, `PUBLISHED`, `ARCHIVED`
- **Business Rules:**
  - All three approvers (CEO, COO, CMO) must approve
  - CMO can override after deadline
  - Content changes reset all approvals

#### Audit & Notifications
- **AuditLog:** Complete change tracking
- **Notification:** In-app and email notifications

### Key Business Logic

#### Approval Reset Rules (RF029)
When a post in `IN_APPROVAL` or `NEEDS_ADJUSTMENT` status has any card content edited:
- All individual approvals reset to `PENDING`
- Post remains in current status
- Notification sent to approvers

#### CMO Override Rule (RF030)
Auto-approval when:
- CMO has approved (`APPROVED`)
- Approval deadline is reached
- At least one other approver is still `PENDING`

#### Domain Restriction
- Google OAuth validates email domain
- Configurable via `ALLOWED_DOMAIN` environment variable
- Auto-provisioning for new users from allowed domain

## API Endpoints

### Authentication
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - OAuth callback
- `GET /auth/profile` - Get current user
- `POST /auth/logout` - Logout

### Users
- `GET /users` - List all users
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user
- `POST /users/:id/approver-role` - Assign approver role
- `DELETE /users/:id/approver-role` - Remove approver role

### Posts
- `GET /posts` - List posts with filtering
- `POST /posts` - Create new post
- `GET /posts/:id` - Get post details
- `PATCH /posts/:id` - Update post
- `POST /posts/:id/submit` - Submit for approval
- `POST /posts/:id/approve` - Approve post (approvers only)
- `POST /posts/:id/reject` - Reject post (approvers only)

### Cards
- `POST /posts/:postId/cards` - Add card to post
- `PATCH /cards/:id` - Update card content
- `DELETE /cards/:id` - Remove card
- `POST /cards/:id/upload` - Upload card asset

### Notifications
- `GET /notifications` - Get user notifications
- `PATCH /notifications/:id/read` - Mark as read
- `PATCH /users/:id/notification-preferences` - Update preferences

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Database Migrations

```bash
# Generate migration
npm run migration:generate -- -n MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

## Security Features

- **JWT Authentication** with configurable expiration
- **Role-based Access Control** with guards
- **Domain-restricted OAuth** login
- **Input Validation** on all endpoints
- **CORS Configuration** for frontend integration
- **File Upload Validation** with size limits

## Monitoring & Logging

- **Request/Response Logging** in development
- **Error Handling** with proper HTTP status codes
- **Database Query Logging** when `NODE_ENV=development`
- **Audit Trail** for all significant actions

## Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Set production environment variables**

3. **Run database migrations:**
   ```bash
   npm run migration:run
   ```

4. **Start the application:**
   ```bash
   npm run start:prod
   ```

## Contributing

1. Follow the existing code style and patterns
2. Add appropriate tests for new features
3. Update API documentation when adding endpoints
4. Ensure all business rules are properly implemented

## License

[Your License Here]