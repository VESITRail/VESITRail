# VESITRail Architecture Documentation

## Executive Summary

VESITRail is a modern, enterprise-grade Progressive Web Application (PWA) designed to streamline the railway student concession application and management process for VESIT students. Built on a robust Next.js 16 architecture with TypeScript, the application provides a comprehensive digital solution replacing traditional paper-based workflows.

### Core Mission

Digitize and automate the entire lifecycle of railway concession applications—from student onboarding and application submission to administrative review, booklet generation, and multi-channel notifications.

### Key Metrics

- **Technology Stack**: Next.js 16, React 19, TypeScript 5, PostgreSQL, Prisma ORM
- **Architecture Pattern**: Server-Side Rendering (SSR) with Server Actions
- **Authentication**: OAuth 2.0 (Google) via Better Auth
- **Infrastructure**: Serverless deployment architecture
- **Real-time Features**: Push notifications, progressive web app capabilities

---

## System Architecture

### 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
├─────────────────────────────────────────────────────────────────┤
│  • Next.js App Router (React 19)                                │
│  • Progressive Web App (Serwist)                                │
│  • Service Worker (Background Sync, Caching)                    │
│  • Firebase Cloud Messaging Client                              │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                          │
├─────────────────────────────────────────────────────────────────┤
│  • Server Components (RSC)                                      │
│  • Server Actions (API Layer)                                   │
│  • Authentication Middleware (Better Auth)                      │
│  • Business Logic Layer                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                       Data Layer                                │
├─────────────────────────────────────────────────────────────────┤
│  • Prisma ORM                                                   │
│  • PostgreSQL Database                                          │
│  • Type-Safe Schema (Zod Generation)                            │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                            │
├─────────────────────────────────────────────────────────────────┤
│  • Cloudflare R2 (File Storage)                                 │
│  • Firebase Cloud Messaging (Push Notifications)                │
│  • SMTP Service (Email Notifications)                           │
│  • PostHog (Analytics)                                          │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Application Architecture Pattern

VESITRail follows a **Layered Architecture** with clear separation of concerns:

#### Layer 1: Presentation Layer

- **Technology**: React 19 with Server Components
- **Responsibilities**:
  - User interface rendering
  - Client-side interactivity
  - Progressive Web App features
  - Real-time UI updates
- **Components**:
  - UI components (shadcn/ui + Radix UI)
  - Layout components
  - Role-based dashboards (Student/Admin)
  - Form components with React Hook Form

#### Layer 2: Business Logic Layer

- **Technology**: Next.js Server Actions
- **Responsibilities**:
  - Business rule enforcement
  - Data validation
  - Authorization checks
  - Workflow orchestration
- **Key Modules**:
  - `src/actions/` - Server action handlers
  - `src/lib/` - Shared utilities and business logic
  - Result pattern for error handling

#### Layer 3: Data Access Layer

- **Technology**: Prisma ORM
- **Responsibilities**:
  - Database queries and mutations
  - Transaction management
  - Data model mapping
  - Type-safe database operations
- **Features**:
  - Generated Prisma Client
  - Zod schema generation for runtime validation
  - Multi-model relationships

#### Layer 4: Integration Layer

- **Responsibilities**:
  - Third-party service integration
  - File upload/download
  - Push notification delivery
  - Email notification delivery
  - Analytics tracking

---

## Database Architecture

### Entity-Relationship Overview

```
User (Core Identity)
├── Admin (1:1)
│   ├── Reviews Students (1:N)
│   ├── Reviews Address Changes (1:N)
│   └── Reviews Applications (1:N)
│
├── Student (1:1)
│   ├── Belongs to Class (N:1)
│   ├── Has Station (N:1)
│   ├── Address Changes (1:N)
│   ├── Concession Applications (1:N)
│   ├── Preferred Class (N:1)
│   └── Preferred Period (N:1)
│
├── Sessions (1:N)
├── Accounts (1:N)
├── FCM Tokens (1:N)
└── Notifications (1:N)
```

### Core Domain Models

#### 1. User Management Domain

- **User**: Central identity entity with authentication data
- **Admin**: Administrative privileges and relationships
- **Student**: Student-specific profile with academic and travel details
- **Session**: Authentication session tracking
- **Account**: OAuth provider linkage
- **FcmToken**: Device registration for push notifications
- **Notification**: In-app notification storage

#### 2. Academic Domain

- **Class**: Student class definition (Year + Branch)
- **Branch**: Academic branch/department
- **Year**: Academic year classification

#### 3. Travel Domain

- **Station**: Railway station master data
- **ConcessionClass**: Concession ticket class (First/Second)
- **ConcessionPeriod**: Concession validity period

#### 4. Application Domain

- **ConcessionApplication**: Primary application entity
  - Lifecycle states: Pending → Approved/Rejected
  - Application types: New, Renewal
  - Links to Student, Station, Class, Period
  - Renewal chain tracking via self-reference
- **ConcessionBooklet**: Physical booklet representation
  - Page tracking (total, damaged)
  - Serial number range
  - Anchor coordinates for PDF overlay
  - Status: Available, InUse, Exhausted, Damaged
- **AddressChange**: Address modification requests
  - Current vs New address/station
  - Approval workflow
  - Document verification

#### 5. Configuration Domain

- **AppConfig**: Key-value configuration store

### Database Schema Highlights

```prisma
// Modular schema organization
schema.prisma (main)
├── models/enums.prisma (Enum definitions)
├── models/admin.prisma (Admin entities)
├── models/student.prisma (Student entities)
└── models/concession.prisma (Application entities)
```

**Key Design Decisions**:

1. **Soft Delete Pattern**: `isActive` flags instead of hard deletes
2. **Audit Trail**: `createdAt`, `updatedAt`, `reviewedAt` timestamps
3. **Resubmission Support**: `submissionCount`, `rejectionReason` fields
4. **Cascading Deletes**: User deletion cascades to related entities
5. **Unique Constraints**: Email, codes, token uniqueness enforcement
6. **Default Values**: Sensible defaults for boolean and enum fields

---

## Authentication & Authorization

### Authentication Flow

```
User Access
    ↓
Google OAuth 2.0
    ↓
Better Auth Middleware
    ↓
Email Domain Validation (@ves.ac.in)
    ↓
User Creation/Session
    ↓
Role Assignment Check
    ↓
Dashboard Access (Student/Admin)
```

### Implementation Details

**Technology**: Better Auth v1.3.28

- **Plugins**: One Tap, Next.js Cookies
- **Adapter**: Prisma PostgreSQL
- **Provider**: Google OAuth

**Security Measures**:

1. **Email Domain Restriction**: Only `@ves.ac.in` emails allowed
2. **Session Management**: Token-based with expiration
3. **CSRF Protection**: Built-in via Better Auth
4. **Secure Cookies**: HTTP-only, secure flags
5. **Name Normalization**: Automatic title case conversion

### Authorization Model

**Role-Based Access Control (RBAC)**:

- **Student Role**:
  - Apply for concessions
  - Request address changes
  - View own applications
  - Manage profile
- **Admin Role**:
  - Review student registrations
  - Approve/reject applications
  - Manage booklets
  - Access analytics
  - Process address changes

**Access Control Implementation**:

- Server-side role checks in all Server Actions
- Route protection via middleware
- Component-level role-based rendering
- Audit trail for admin actions

---

## Feature Architecture

### 1. Student Onboarding System

**Multi-Step Progressive Flow**:

```
Step 1: Personal Information
  ├── Name (First, Middle, Last)
  ├── Date of Birth
  ├── Gender
  └── Profile Photo Upload
        ↓
Step 2: Academic Details
  ├── Branch Selection
  ├── Year Selection
  └── Class Auto-Assignment
        ↓
Step 3: Travel Details
  ├── Home Station Selection
  ├── Home Address
  ├── Preferred Concession Class
  └── Preferred Concession Period
        ↓
Step 4: Document Verification
  ├── Aadhaar Card Upload (Cloudflare R2)
  └── Document Preview
        ↓
Step 5: Review & Submit
  ├── Data Validation
  └── Submission
        ↓
Admin Review (Pending State)
  ├── Approve → Student Dashboard Access
  └── Reject → Resubmission with Reasons
```

**Technical Implementation**:

- Form state management: React Hook Form + Zod validation
- File uploads: Cloudflare R2 SDK with presigned URLs
- Resubmission support: Track count, preserve data
- Server action: `submitOnboarding()`

### 2. Concession Application System

**Application Lifecycle**:

```
New Application Creation
  ├── Auto-fill from Student Profile
  ├── Station Selection
  ├── Class Selection (override preferred)
  ├── Period Selection (override preferred)
  └── Submit for Review
        ↓
Admin Review Queue
  ├── Application Details
  ├── Student Verification
  ├── Booklet Assignment
  └── Decision
        ├── Approve
        │     ├── Assign Page in Booklet
        │     ├── Generate PDF Entry
        │     └── Send Notifications
        └── Reject
              ├── Provide Reason
              └── Allow Resubmission
                    ↓
Approved State
  ├── Available for Renewal
  └── PDF Generation on Booklet Finalization
```

**Renewal Chain Management**:

- Previous application linkage via `previousApplicationId`
- Self-referencing relationship for audit trail
- Automatic period validation
- Station continuity enforcement

**Technical Implementation**:

- Server actions: `submitConcession()`, `reviewApplication()`
- Pagination support for application lists
- Filtering by status, date, student
- Optimistic UI updates

### 3. Concession Booklet Management

**Booklet Lifecycle**:

```
Booklet Creation
  ├── Serial Number Range
  ├── Total Pages (default: 50)
  ├── PDF Anchor Coordinates (x, y)
  ├── Auto-increment Booklet Number
  └── Status: Available
        ↓
Application Assignment
  ├── Calculate Next Available Page
  ├── Assign to Application
  ├── Mark Pages as Damaged (if applicable)
  └── Update Status (Available → InUse)
        ↓
Booklet Finalization
  ├── Generate Consolidated PDF
  │     ├── jsPDF for table generation
  │     ├── pdf-lib for overlay creation
  │     └── Custom formatting
  ├── Mark Exhausted when full
  └── Archive
```

**Damaged Page Tracking**:

- Array of damaged page numbers
- Automatic skip during assignment
- Included in PDF with "DAMAGED" marker
- Reduces available capacity

**PDF Generation Architecture**:

- **Base Document**: jsPDF with auto-table plugin
- **Overlay Layer**: pdf-lib for positioning
- **Data Rendering**:
  - Student information table
  - Application details
  - Station and class information
  - Period and validity
- **Anchor Positioning**: Configurable X/Y coordinates per booklet
- **Export Format**: Legal landscape orientation

### 4. Address Change System

**Workflow**:

```
Student Request
  ├── Current Address (locked)
  ├── New Address Input
  ├── New Station Selection
  ├── Document Upload (proof of address)
  └── Submit Request
        ↓
Admin Review
  ├── Compare Current vs New
  ├── Verify Documentation
  └── Decision
        ├── Approve
        │     ├── Update Student Record
        │     ├── Update Future Applications
        │     └── Notify Student
        └── Reject
              ├── Provide Reason
              └── Allow Resubmission
```

**Data Integrity**:

- Capture current state at request time
- Prevent concurrent address changes
- Atomic updates on approval
- Audit trail preservation

### 5. Notification System

**Multi-Channel Architecture**:

```
Event Trigger
    ↓
Notification Handler
    ├── User Preference Check
    ├── Scenario Selection
    └── Parallel Dispatch
          ├── Push Notification (FCM)
          │     ├── Device Token Resolution
          │     ├── Payload Construction
          │     └── Firebase Admin SDK
          │
          ├── In-App Notification
          │     ├── Database Insert
          │     └── Real-time Update
          │
          └── Email Notification
                ├── Template Generation
                ├── SMTP Dispatch
                └── Delivery Tracking
```

**Notification Scenarios**:

| Category        | Scenario              | Channels            |
| --------------- | --------------------- | ------------------- |
| Student Account | Registration Approved | Push, Email, In-App |
| Student Account | Registration Rejected | Push, Email, In-App |
| Concession      | Application Approved  | Push, Email, In-App |
| Concession      | Application Rejected  | Push, Email, In-App |
| Concession      | Renewal Due           | Push, Email         |
| Address Change  | Request Approved      | Push, Email, In-App |
| Address Change  | Request Rejected      | Push, Email, In-App |

**Technical Implementation**:

- **FCM Integration**: Firebase Admin SDK for server-side push
- **Token Management**: Multi-device support per user
- **Platform Targeting**: Web, iOS, Android
- **Email Templates**: Dynamic HTML generation
- **User Preferences**: Granular enable/disable per channel
- **Notification Storage**: In-app notification persistence
- **Read Tracking**: Mark as read functionality

### 6. Progressive Web App Features

**Service Worker Strategy**:

```typescript
Cache Strategies by Resource Type:
├── Static Assets (CacheFirst)
│   ├── Fonts (Google, Gstatic)
│   ├── Images (Next.js optimized)
│   ├── Scripts (JS bundles)
│   └── Styles (CSS files)
│
├── API Routes (NetworkFirst)
│   ├── Server Actions
│   ├── Authentication
│   └── Data Mutations
│
├── Documents (NetworkFirst)
│   └── HTML pages
│
└── External APIs (NetworkOnly)
    ├── Cloudflare R2
    ├── Firebase
    └── Analytics
```

**PWA Capabilities**:

1. **Installability**: Web App Manifest with shortcuts
2. **Offline Support**: Service Worker caching
3. **Background Sync**: Failed request retry
4. **Push Notifications**: FCM integration
5. **App Shortcuts**: Quick actions from home screen
6. **Update Management**: Version checking and auto-update
7. **Cache Invalidation**: Version-based cache clearing

**Version Management**:

- GitHub API integration for latest version check
- Periodic update checks (30-minute intervals)
- User-prompted updates with reload
- Cache busting on version change

---

## Data Flow Patterns

### 1. Request-Response Cycle

```
Client Component
    ↓
Server Action Call
    ↓
Authentication Check (Better Auth)
    ↓
Authorization Check (Role-based)
    ↓
Input Validation (Zod Schema)
    ↓
Business Logic Execution
    ↓
Database Transaction (Prisma)
    ↓
Result Pattern Return
    ↓
Client State Update
    ↓
UI Re-render (React)
```

### 2. Error Handling Pattern

**Result Type Implementation**:

```typescript
type Result<TData, TError> =
  | { isSuccess: true; data: TData }
  | { isSuccess: false; error: TError }

Error Types:
├── AuthError (Authentication failures)
├── DatabaseError (Database operations)
├── ValidationError (Input validation)
├── NotFoundError (Resource not found)
└── UnauthorizedError (Permission denied)
```

**Benefits**:

- Type-safe error handling
- No exceptions for expected failures
- Explicit error handling at call sites
- Composable error handling

### 3. State Management

**Server State**:

- Server Components for initial data
- Server Actions for mutations
- Revalidation paths for cache invalidation
- No client-side state management library needed

**Client State**:

- React hooks for local UI state
- URL parameters for shareable state
- LocalStorage for user preferences
- Service Worker cache for offline state

### 4. File Upload Flow

```
Client File Selection
    ↓
R2 Upload Component (Client-side)
    ↓
Presigned URL Request
    ↓
Direct Upload to Cloudflare R2
    ↓
Public URL Generation
    ↓
URL Storage in Database
    ↓
CDN Delivery via Custom Domain
```

**Cloudflare R2 Configuration**:

- S3-compatible API
- Folder-based organization
- Delete on application rejection
- Presigned URLs for secure uploads
- Public URL access via custom domain

---

## Security Architecture

### 1. Authentication Security

```
Security Layers:
├── OAuth 2.0 (Google Provider)
├── Email Domain Validation
├── Session Token Management
├── CSRF Protection
├── HTTP-Only Cookies
└── Secure Cookie Flags
```

### 2. Authorization Security

**Server-Side Enforcement**:

- All Server Actions check authentication
- Role-based access control on every action
- Student ID validation for resource access
- Admin verification for privileged operations

**Data Access Patterns**:

```typescript
// Student can only access own data
if (session.user.student?.userId !== studentId) {
	return failure(unauthorizedError());
}

// Admin required for reviews
if (!session.user.admin) {
	return failure(unauthorizedError());
}
```

### 3. Data Security

**Input Validation**:

- Custom validation rules
- Type coercion and transformation
- Zod schema validation on all inputs
- Generated schemas from Prisma models

**Database Security**:

- SQL injection prevention
- Encrypted connections (SSL)
- Parameterized queries via Prisma
- Row-level security through application logic

**File Security**:

- Private R2 bucket
- Presigned URLs for uploads
- Automatic cleanup on rejection
- Document verification before storage

### 4. API Security

**Rate Limiting**:

- Edge function limits
- Per-IP connection throttling
- CDN protection (if configured)

**CORS Configuration**:

- Restricted API routes
- Secure headers configuration
- Same-origin policy enforcement

---

## Performance Optimization

### 1. Rendering Strategy

**Server Components**:

- Default for all components
- Zero JavaScript to client
- Direct database access
- SEO-friendly

**Client Components**:

- Only for interactivity
- Marked with 'use client'
- Minimal bundle size
- Strategic code splitting

### 2. Data Fetching

**Optimization Techniques**:

- Selective field inclusion
- Pagination for large datasets
- Index optimization on foreign keys
- Parallel data fetching where possible
- Database query optimization with Prisma

**Caching Strategy**:

- Next.js automatic caching
- Revalidation on mutations
- Cloudflare R2 CDN caching
- Service Worker caching for offline

### 3. Bundle Optimization

**Code Splitting**:

- Route-based automatic splitting
- Lazy loading for modals and dialogs
- Dynamic imports for heavy components
- Separate chunks for admin/student routes

**Asset Optimization**:

- Next.js Image component
- Cloudflare R2 CDN delivery
- Font subsetting (Inter)
- Icon tree-shaking (Lucide)

### 4. Database Performance

**Query Optimization**:

```prisma
// Efficient includes
include: {
  student: { select: { firstName: true, lastName: true } },
  station: { select: { name: true, code: true } }
}

// Indexed fields
@@unique([email])
@@unique([token])
@@index([studentId])
```

**Connection Pooling**:

- Prisma connection pooling
- Serverless database driver
- Connection reuse across requests

---

## Scalability Considerations

### 1. Horizontal Scaling

**Serverless Architecture**:

- Automatic scaling
- No server management
- Pay-per-execution model
- Edge function support

**Database Scaling**:

- PostgreSQL database
- Connection pooling
- Read replicas (future)
- Automatic backups

### 2. Vertical Scaling

**Resource Optimization**:

- Efficient database queries
- Minimal server action complexity
- Optimistic UI updates
- Background job processing (future)

### 3. Caching Layers

```
Request Flow with Caching:
├── CDN Cache (Edge Network)
├── Service Worker Cache (Client)
├── Next.js Cache (Server)
├── Database Query Cache (Prisma)
└── PostgreSQL Cache (Database)
```

### 4. Future Scaling Strategies

**Potential Enhancements**:

- Redis for session storage
- Background job queue (Bull, BullMQ)
- Elasticsearch for search
- Separate microservices for PDF generation
- WebSocket for real-time updates
- GraphQL API layer

---

## Monitoring & Observability

### 1. Analytics

**PostHog Integration**:

- User behavior tracking
- Feature flag support
- A/B testing capability
- Session recording
- Funnel analysis

**Custom Events**:

- Application submissions
- Address change requests
- Booklet generations
- Notification deliveries
- User onboarding completion

### 2. Error Tracking

**Error Handling Layers**:

- Global error boundary (React)
- Server action error returns
- Database error catching
- External service error handling

**Logging**:

- Server-side console logging
- Serverless function logs
- Database query logs
- Error aggregation (via Result pattern)

### 3. Performance Monitoring

**Metrics**:

- Core Web Vitals
- Server action execution time
- Database query performance
- API response times
- Cache hit rates

---

## Deployment Architecture

### 1. Infrastructure

**Hosting**: Serverless Platform

- Automatic deployments from Git
- Preview deployments for PRs
- Edge network distribution
- Automatic SSL/TLS

**Database**: PostgreSQL

- Serverless PostgreSQL
- Automatic scaling
- Connection pooling
- Automated backups

**CDN**: Cloudflare R2

- Document storage
- S3-compatible API
- Global CDN delivery

**Push Notifications**: Firebase Cloud Messaging

- Multi-platform support
- Reliable delivery
- Device token management

### 2. Deployment Pipeline

```
Code Push (GitHub)
    ↓
Semantic Release (Version Bump)
    ↓
CI/CD Build
    ├── Next.js Build
    ├── Prisma Generate
    ├── Type Checking
    └── Linting
    ↓
Deploy (Preview/Production)
    ↓
Database Migration (if needed)
    ↓
Health Checks
    ↓
Live Deployment
```

**Environments**:

- **Development**: Local development with hot reload
- **Preview**: Automatic PR preview deployments
- **Production**: Main branch deployment

### 3. Database Migrations

**Migration Strategy**:

- Prisma Migrate for schema changes
- Version-controlled migrations
- Rollback capability
- Zero-downtime deployments

**Migration Files**:

```
prisma/migrations/
├── migration_lock.toml
├── 20250719154152_init/
├── 20250726074241_add_student_resubmission_support/
├── 20250729134543_add_fcm_token_model/
└── ... (20+ migrations)
```

---

## Development Workflow

### 1. Code Organization

```
src/
├── actions/              # Server Actions (API Layer)
│   ├── student.ts       # Student management
│   ├── concession.ts    # Application management
│   ├── booklets.ts      # Booklet management
│   ├── notifications.ts # Notification system
│   └── ...
├── app/                 # Next.js App Router
│   ├── (routes)/       # Route groups
│   ├── api/            # API routes
│   └── globals.css     # Global styles
├── components/          # React Components
│   ├── ui/             # shadcn/ui components
│   ├── student/        # Student features
│   ├── admin/          # Admin features
│   └── layout/         # Layout components
├── config/              # Configuration
│   ├── firebase.ts     # Firebase config
│   ├── navigation.ts   # Navigation config
│   └── guide.ts        # Guide content
├── hooks/               # Custom React Hooks
│   ├── use-fcm.ts      # Push notification hook
│   ├── use-app-update.ts # Update detection
│   └── ...
├── lib/                 # Shared Utilities
│   ├── auth.ts         # Authentication setup
│   ├── prisma.ts       # Database client
│   ├── result.ts       # Result type utilities
│   ├── utils.ts        # Helper functions
│   ├── notifications/  # Notification system
│   └── pwa/            # PWA utilities
└── generated/           # Generated Code
    ├── prisma/         # Prisma Client
    └── zod/            # Zod Schemas
```

### 2. Development Standards

**Code Quality**:

- TypeScript strict mode
- ESLint with Next.js config
- Prettier formatting
- Conventional commits
- Husky pre-commit hooks
- Lint-staged for staged files

**Testing Strategy** (Future):

- Unit tests for utilities
- Integration tests for actions
- E2E tests for critical flows
- Visual regression tests

### 3. Git Workflow

**Branch Strategy**:

- `main` - Production branch
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches
- `docs/*` - Documentation branches

**Commit Convention**:

```
type(scope): description

Examples:
feat(concession): add renewal chain tracking
fix(auth): resolve session expiration issue
docs(architecture): update database section
```

**Semantic Release**:

- Automatic version bumping
- CHANGELOG generation
- GitHub release creation
- Tag management

---

## Technology Stack Rationale

### Frontend Technologies

**Next.js 16**:

- Server Components for optimal performance
- App Router for modern routing
- Built-in optimization
- Excellent TypeScript support
- Seamless deployment integration

**React 19**:

- Server Components
- Improved suspense
- Better concurrent rendering
- Enhanced hooks

**TypeScript 5**:

- Type safety across entire codebase
- Enhanced developer experience
- Reduced runtime errors
- Better refactoring support

**Tailwind CSS 4**:

- Utility-first approach
- Excellent performance
- Dark mode support
- Responsive design utilities
- Custom design system

**shadcn/ui + Radix UI**:

- Accessible components
- Customizable styling
- No runtime overhead
- Comprehensive component library
- Excellent TypeScript support

### Backend Technologies

**Prisma ORM**:

- Type-safe database access
- Automatic migrations
- Intuitive query API
- Multiple database support
- Excellent TypeScript integration
- Zod schema generation

**Better Auth**:

- Modern authentication solution
- Multiple provider support
- Excellent Next.js integration
- Type-safe API
- Extensible plugin system

**PostgreSQL**:

- ACID compliance
- Robust relational model
- Excellent performance
- Serverless scaling
- Automatic backups

### Infrastructure Technologies

**Serverless Platform**:

- Seamless Next.js deployment
- Automatic scaling
- Edge network
- Preview deployments
- Zero configuration

**Cloudflare R2**:

- S3-compatible object storage
- Zero egress fees
- CDN delivery
- Custom domain support
- Cost-effective storage

**Firebase Cloud Messaging**:

- Cross-platform push notifications
- Reliable delivery
- Rich notification support
- Background message handling
- Device token management

**PostHog**:

- Open-source analytics
- Feature flags
- Session recording
- Self-hosted option
- GDPR compliant

---

## Appendices

### A. Key Design Patterns

1. **Server-Side Rendering (SSR)**: Default rendering strategy
2. **Repository Pattern**: Prisma as data access layer
3. **Result Pattern**: Type-safe error handling
4. **Factory Pattern**: Dynamic notification scenario selection
5. **Strategy Pattern**: Multiple cache strategies in service worker
6. **Observer Pattern**: Real-time notification updates
7. **Command Pattern**: Server actions as commands

### B. API Conventions

**Server Action Naming**:

- `get*`: Read operations (e.g., `getStudents`)
- `create*`: Create operations (e.g., `createBooklet`)
- `update*`: Update operations (e.g., `updateProfile`)
- `delete*`: Delete operations (e.g., `deleteBooklet`)
- `submit*`: Complex submission flows (e.g., `submitOnboarding`)
- `review*`: Admin review actions (e.g., `reviewApplication`)

**Return Types**:

- All actions return `Result<TData, TError>`
- Success: `{ isSuccess: true, data: T }`
- Failure: `{ isSuccess: false, error: E }`

### C. Environment Variables

**Required Variables**:

```env
# Core
NEXT_PUBLIC_SITE_URL
BETTER_AUTH_SECRET
BETTER_AUTH_URL
DATABASE_URL

# Authentication
GOOGLE_CLIENT_SECRET
NEXT_PUBLIC_GOOGLE_CLIENT_ID

# File Storage
R2_ENDPOINT
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_PUBLIC_URL

# Notifications
FIREBASE_SERVICE_ACCOUNT
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_API_KEY
SMTP_EMAIL
SMTP_PASSWORD

# Analytics (Optional)
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST
```

### D. Browser Support

**Supported Browsers**:

- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions
- Mobile browsers: iOS Safari 14+, Chrome Android 90+

**Progressive Enhancement**:

- Core functionality works without JavaScript
- Enhanced features with JavaScript enabled
- PWA features in supported browsers
- Graceful degradation for older browsers

---

## Conclusion

VESITRail represents a modern, scalable, and maintainable architecture for a complex workflow management system. The architecture prioritizes:

1. **Developer Experience**: Type safety, clear patterns, excellent tooling
2. **User Experience**: Fast, responsive, offline-capable
3. **Maintainability**: Clear separation of concerns, modular design
4. **Scalability**: Serverless architecture, efficient caching
5. **Security**: Multiple layers of protection, secure by default
6. **Observability**: Comprehensive monitoring and analytics

The architecture is designed to evolve with the application's needs while maintaining stability and performance. The use of modern technologies and best practices ensures that VESITRail can scale to handle growing user bases and feature sets while delivering an exceptional user experience.

---

**Document Version**: 1.1  
**Last Updated**: November 10, 2025  
**Maintained By**: VESITRail Development Team
