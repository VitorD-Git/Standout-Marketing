# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

**Frontend Development:**
- `npm install` - Install dependencies
- `npm run dev` - Start development server on Vite
- `npm run build` - Build for production
- `npm run preview` - Preview production build

**Backend Development:**
- `cd backend && npm install` - Install backend dependencies
- Backend appears to be NestJS-based but minimal implementation exists

**Environment Setup:**
- Set `GEMINI_API_KEY` in `.env.local` for frontend Gemini integration
- Vite config exposes `GEMINI_API_KEY` as `process.env.API_KEY` and `process.env.GEMINI_API_KEY`

## Architecture Overview

This is a **Content Approval System** for marketing posts with sophisticated workflow management.

### Core Domain Model

**Users & Roles:**
- `UserRole`: Editor, Approver, Admin
- `ApproverDesignation`: CEO, COO, CMO (fixed approver roles)
- Domain-restricted authentication via Google OAuth

**Content Structure:**
- `Post`: Container with title, publication date, briefing, status
- `Card`: Individual content units within posts (main text, art text, designer notes, finalized art)
- `Tag` and `Release`: Organizational structures managed by admins

**Approval Workflow:**
- Multi-stage approval requiring CEO, COO, CMO sign-off
- Complex state transitions: Draft → In Approval → Needs Adjustments → Approved → Published → Archived
- Auto-reset of approvals when content is edited during review
- CMO override rule for deadline-based auto-approval

### Key Technical Patterns

**State Management:**
- React Context pattern for `AuthContext`, `NotificationContext`, `PostContext`, `AdminContext`
- localStorage persistence for user sessions and app state
- Version history tracking for all content changes

**Data Persistence:**
- Currently frontend-only with localStorage
- Comprehensive type definitions in `types.ts` suggest database-ready entities
- Version history pattern: `VersionHistory<T>` interface tracks user, timestamp, and value changes

**Authentication Flow:**
- Domain-restricted login via email validation
- Auto-provisioning of new users from allowed domain
- Admin-configurable domain restrictions

### Component Architecture

**Layout Structure:**
- `Layout.tsx` with `Header`, `Sidebar`, `NotificationPanel`
- Route protection via `ProtectedRoute` and `AdminRoute` components
- Nested routing structure with admin-specific routes

**Core Pages:**
- Dashboard: Role-specific views for editors vs approvers
- Post management: Create, edit, list, approval workflows
- Admin pages: User management, tags, releases, settings
- Notification system with preferences

**Shared Components:**
- `Modal`, `LoadingSpinner`, `VersionHistoryViewer`, `AuditLogDisplay`
- Icon components in `components/icons/`

## Key Implementation Notes

**Complex Business Logic Areas:**
- Approval state management with multi-approver coordination
- Version history and audit logging for compliance
- Notification routing based on user roles and preferences
- Status transitions with validation rules

**Data Relationships:**
- Posts contain multiple Cards (1:many)
- Posts link to Tags and Releases (many:many, many:one)
- Approval tracking per post per approver
- Comprehensive audit logging for all changes

**Frontend-First Architecture:**
- TypeScript throughout with strict typing
- Reactive state management via contexts
- Local storage as current persistence layer
- Backend entities defined but not yet implemented