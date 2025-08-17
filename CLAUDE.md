# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ CRITICAL RULES - MUST FOLLOW

### 🔴 TypeScript Zero-Error Policy
**MANDATORY: ALL TypeScript errors MUST be fixed BEFORE ANY commit/push**
- **Run `npm run type-check` before EVERY commit - MUST show 0 errors**
- **TypeScript errors = Vercel deployment FAILURE**
- **NEVER use @ts-ignore or any type suppression**
- **Fix ALL type errors IMMEDIATELY when detected**

## Project Overview

**The Match** is a tournament and league management platform built with Next.js 14 and TypeScript. The service enables users to create matches, manage teams, and organize sports competitions with a focus on mobile-first design and cost-effective architecture.

### Key Architecture Changes
- **Major terminology change**: "Tournament" → "Match" throughout the codebase (completed)
- **Core concept**: Individual "matches" are the primary unit, not tournaments
- **Database schema**: Still uses legacy table names but application layer uses "match" terminology

## Common Development Commands

### Essential Commands
```bash
# Development
pnpm dev                    # Start development server
pnpm build                  # Build for production
pnpm start                  # Start production server
pnpm lint                   # Run ESLint
pnpm type-check             # Run TypeScript type checking
pnpm format                 # Format code with Prettier

# Supabase
pnpm supabase:start         # Start local Supabase
pnpm supabase:stop          # Stop local Supabase
pnpm supabase:reset         # Reset local database
pnpm supabase:gen-types     # Generate TypeScript types

# Package management
pnpm install                # Install dependencies (uses pnpm)

# Deployment (Quick)
git add .                   # Stage all changes
git commit -m "fix: message" # Commit with conventional message
git push origin main        # Deploy to production via Vercel
```

### Environment Requirements
- Node.js 18+
- pnpm package manager
- Supabase account and local CLI

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth
- **Deployment**: Vercel (free tier optimized)

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── matches/       # Match management APIs
│   │   └── teams/         # Team management APIs
│   ├── matches/           # Match pages
│   ├── teams/             # Team pages
│   └── auth/              # Authentication pages
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── match/            # Match-specific components
│   └── team/             # Team-specific components
├── lib/                  # Utilities and configurations
│   ├── supabase.ts       # Supabase client and helpers
│   └── utils.ts          # General utilities
├── types/                # TypeScript type definitions
├── hooks/                # Custom React hooks
└── utils/                # Helper functions
```

### Key Database Tables
- `matches`: Match information (formerly tournaments)
- `teams`: Team information
- `players`: Player information
- `match_participants`: Match participation system
- `profiles`: User profiles

## Core Features and Components

### Match Management System
- **API Routes**: `/api/matches`, `/api/matches/[id]`
- **Components**: `MatchCard`, `MatchForm`, `MatchList`, `MatchDetail`
- **Features**: CRUD operations, match types (single elimination, double elimination, round robin, etc.)

### Team Management System
- **API Routes**: `/api/teams`, `/api/teams/[id]`
- **Components**: `TeamCard`, `TeamForm`, `TeamList`, `TeamDetail`
- **Features**: Team CRUD, player management, match participation

### Match Participation System
- **API Routes**: `/api/matches/[id]/participants`
- **Components**: `JoinMatchButton`, `ParticipantList`, `ParticipantCard`
- **Features**: Team application, approval/rejection, status tracking

### Authentication & Authorization
- **Supabase Auth**: Email/password and social login
- **Row Level Security**: Database-level access control
- **Role-based permissions**: Match creators, team captains, participants

## 🔐 Page Access Control & Permissions

### Permission Levels

#### 1. **Guest (비로그인)**
- 공개 정보 조회만 가능
- 회원가입/로그인 유도

#### 2. **Authenticated User (로그인 사용자)**
- 기본 사용자 권한
- 프로필 관리 가능
- 팀 생성 가능

#### 3. **Team Captain (팀 주장)**
- 팀 관리 권한
- 선수 추가/수정/삭제
- 경기 참가 신청

#### 4. **Team Member (팀 멤버)**
- 팀 정보 조회
- 팀 채팅 참여
- 체크인 가능

#### 5. **Match Creator (경기 생성자)**
- 경기 전체 관리
- 참가 신청 승인/거절
- 경기 진행 및 결과 입력

#### 6. **Match Participant (경기 참가자)**
- 경기 상세 정보 조회
- 경기 진행 상황 확인
- 결과 조회

### Page-by-Page Access Control

| Page | Path | Guest | Authenticated | Team Captain | Team Member | Match Creator | Match Participant |
|------|------|-------|---------------|--------------|-------------|---------------|-------------------|
| **홈** | `/` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **로그인** | `/login` | ✅ | ❌ (redirect) | ❌ (redirect) | ❌ (redirect) | ❌ (redirect) | ❌ (redirect) |
| **회원가입** | `/signup` | ✅ | ❌ (redirect) | ❌ (redirect) | ❌ (redirect) | ❌ (redirect) | ❌ (redirect) |
| **프로필** | `/profile` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **대시보드** | `/dashboard` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| | | | | | | | |
| **경기 목록** | `/matches` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **경기 상세** | `/matches/[id]` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **경기 생성** | `/matches/create` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **경기 수정** | `/matches/[id]/edit` | ❌ | ❌ | ❌ | ❌ | ✅ (본인) | ❌ |
| **대진표** | `/matches/[id]/bracket` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **경기 결과** | `/matches/[id]/results` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **점수 입력** | `/matches/[id]/games/[gameId]/score` | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **체크인** | `/matches/[id]/checkin` | ❌ | ❌ | ✅ (참가팀) | ✅ (참가팀) | ✅ | ✅ |
| **경기 캘린더** | `/matches/calendar` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **템플릿** | `/matches/templates` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **템플릿 생성** | `/matches/templates/create` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| | | | | | | | |
| **팀 목록** | `/teams` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **팀 상세** | `/teams/[id]` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **팀 생성** | `/teams/create` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **팀 채팅** | `/teams/[id]/chat` | ❌ | ❌ | ✅ (본인팀) | ✅ (본인팀) | ❌ | ❌ |
| | | | | | | | |
| **선수 목록** | `/players` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **선수 상세** | `/players/[id]` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| | | | | | | | |
| **통계** | `/stats` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **체크인 관리** | `/checkin` | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

### API Route Permissions

| API Route | Method | Guest | Authenticated | Team Captain | Team Member | Match Creator | Match Participant |
|-----------|--------|-------|---------------|--------------|-------------|---------------|-------------------|
| `/api/matches` | GET | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/api/matches` | POST | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/api/matches/[id]` | GET | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/api/matches/[id]` | PUT | ❌ | ❌ | ❌ | ❌ | ✅ (본인) | ❌ |
| `/api/matches/[id]` | DELETE | ❌ | ❌ | ❌ | ❌ | ✅ (본인) | ❌ |
| `/api/matches/[id]/participants` | GET | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/api/matches/[id]/participants` | POST | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `/api/matches/[id]/participants/[pid]` | PUT | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| `/api/matches/[id]/status` | PUT | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| | | | | | | | |
| `/api/teams` | GET | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/api/teams` | POST | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/api/teams/[id]` | GET | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/api/teams/[id]` | PUT | ❌ | ❌ | ✅ (본인팀) | ❌ | ❌ | ❌ |
| `/api/teams/[id]` | DELETE | ❌ | ❌ | ✅ (본인팀) | ❌ | ❌ | ❌ |

### Permission Check Implementation

#### 1. Frontend Route Protection
```typescript
// src/middleware.ts
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('supabase-auth-token');
  
  // Guest-only pages (redirect if authenticated)
  const guestOnlyPaths = ['/login', '/signup'];
  if (guestOnlyPaths.includes(pathname) && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Auth-required pages
  const authRequiredPaths = [
    '/profile',
    '/dashboard',
    '/matches/create',
    '/teams/create'
  ];
  if (authRequiredPaths.some(path => pathname.startsWith(path)) && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
```

#### 2. API Route Protection
```typescript
// src/lib/auth-middleware.ts
export async function checkPermission(
  user: AuthUser,
  resource: 'match' | 'team' | 'player',
  action: 'view' | 'create' | 'update' | 'delete',
  resourceId?: string
): Promise<boolean> {
  // Implementation based on permission matrix above
}
```

#### 3. Component-Level Protection
```typescript
// src/components/ProtectedRoute.tsx
export function ProtectedRoute({ 
  children, 
  requireAuth = false,
  requireTeamCaptain = false,
  requireMatchCreator = false 
}) {
  const { user, loading } = useAuth();
  
  if (loading) return <Loading />;
  if (requireAuth && !user) return <Redirect to="/login" />;
  // Additional permission checks...
  
  return children;
}
```

### Permission Hierarchy

1. **Match Creator** > All permissions for their match
2. **Team Captain** > All permissions for their team
3. **Team Member** > Limited team permissions
4. **Match Participant** > Limited match permissions
5. **Authenticated User** > Basic permissions
6. **Guest** > Public read-only access

### Security Best Practices

1. **Double Validation**: Check permissions both on frontend and backend
2. **Row Level Security**: Use Supabase RLS for database-level protection
3. **API Middleware**: Validate all API requests with auth middleware
4. **Session Management**: Implement proper session timeout and refresh
5. **Error Handling**: Don't expose sensitive permission details in errors

## Design System Guidelines

### Core Design Principles
1. **Minimalism**: Less is more - focus on content and functionality
2. **Consistency**: Uniform design patterns across all pages
3. **Hierarchy**: Clear visual hierarchy through spacing and typography
4. **Accessibility**: WCAG 2.1 AA compliance minimum
5. **Performance**: Optimize for mobile-first experience

### Color Palette
**Primary Colors** (Limited, purposeful use)
- **Primary Blue**: `#2563EB` (blue-600) - Main actions, links
- **Primary Dark**: `#1E40AF` (blue-800) - Hover states
- **Success Green**: `#10B981` (emerald-500) - Positive actions, success states
- **Error Red**: `#EF4444` (red-500) - Errors, critical actions
- **Warning Orange**: `#F59E0B` (amber-500) - Warnings, deadlines

**Neutral Colors** (Main UI colors)
- **Gray-900**: `#111827` - Primary text
- **Gray-700**: `#374151` - Secondary text
- **Gray-500**: `#6B7280` - Tertiary text, placeholders
- **Gray-200**: `#E5E7EB` - Borders
- **Gray-100**: `#F3F4F6` - Backgrounds
- **Gray-50**: `#F9FAFB` - Light backgrounds
- **White**: `#FFFFFF` - Cards, primary backgrounds

**Usage Rules**
- Maximum 3 colors per component (excluding neutrals)
- Primary color for main CTAs only
- Semantic colors for status (green=success, red=error)
- 60-30-10 rule: 60% neutral, 30% secondary, 10% accent

### Typography Scale
**Mobile-First Sizing** (Base: 16px)
```css
/* Headings */
h1: text-2xl (24px) / lg:text-3xl (30px) - Page titles
h2: text-xl (20px) / lg:text-2xl (24px) - Section headers  
h3: text-lg (18px) / lg:text-xl (20px) - Card titles
h4: text-base (16px) / lg:text-lg (18px) - Subsections

/* Body Text */
body: text-sm (14px) / lg:text-base (16px) - Main content
small: text-xs (12px) / lg:text-sm (14px) - Secondary info
caption: text-xs (12px) - Metadata, timestamps

/* Font Weights */
- Regular (400): Body text
- Medium (500): Important text
- Semibold (600): Buttons, links
- Bold (700): Headings only
```

### Spacing System
**8px Grid System** (Consistent spacing)
```css
/* Spacing Scale */
space-0: 0px
space-1: 4px (0.25rem)
space-2: 8px (0.5rem) - Minimum spacing
space-3: 12px (0.75rem)
space-4: 16px (1rem) - Default element spacing
space-5: 20px (1.25rem)
space-6: 24px (1.5rem) - Section spacing
space-8: 32px (2rem) - Large section spacing
space-10: 40px (2.5rem) - Page sections

/* Mobile Padding */
px-4 (16px) - Mobile horizontal padding
py-6 (24px) - Mobile section padding

/* Desktop Padding */
lg:px-8 (32px) - Desktop horizontal padding
lg:py-8 (32px) - Desktop section padding
```

### Component Design Standards

#### Cards
```css
/* Base Card */
- Background: white
- Border: border-gray-200 (1px)
- Border Radius: rounded-lg (8px)
- Padding: p-4 (16px) mobile / p-5 (20px) desktop
- Shadow: shadow-sm on hover
- Transition: all 150ms ease

/* Interactive Card */
- Hover: shadow-md, border-blue-300, translateY(-2px)
- Active: scale(0.98)
```

#### Buttons
```css
/* Primary Button */
- Background: bg-blue-600
- Text: text-white, text-sm, font-medium
- Padding: px-4 py-2
- Border Radius: rounded-lg
- Hover: bg-blue-700

/* Secondary Button */  
- Background: bg-gray-100
- Text: text-gray-700
- Border: border-gray-300

/* Button Sizes */
- Small: px-3 py-1.5 text-xs
- Medium: px-4 py-2 text-sm (default)
- Large: px-6 py-3 text-base
```

#### Forms
```css
/* Input Fields */
- Height: h-10 (40px)
- Padding: px-3
- Border: border-gray-300
- Border Radius: rounded-lg
- Focus: ring-2 ring-blue-500
```

### Layout Guidelines

#### Mobile-First Grid
```css
/* Container */
max-w-7xl mx-auto

/* Grid Layouts */
- Mobile: grid-cols-1
- Tablet: sm:grid-cols-2
- Desktop: lg:grid-cols-3 or lg:grid-cols-4

/* Gap */
- gap-4 (16px) - Default
- gap-6 (24px) - Large sections
```

#### Section Structure
```css
/* Section Padding */
- Mobile: py-6 px-4
- Tablet: sm:py-8 sm:px-6
- Desktop: lg:py-10 lg:px-8

/* Content Width */
- max-w-7xl for main content
- max-w-4xl for reading content
- max-w-2xl for forms
```

### Animation & Interaction
```css
/* Transitions */
- Default: transition-all duration-150
- Hover effects: duration-200
- Page transitions: duration-300

/* Hover States */
- Subtle: opacity-80
- Cards: shadow-md, translateY(-2px)
- Buttons: darker background
- Links: underline or color change

/* Disabled States */
- opacity-50
- cursor-not-allowed
- no hover effects
```

### Icon Usage
- Size: w-4 h-4 (16px) for inline, w-5 h-5 (20px) for standalone
- Color: Match text color or use semantic colors
- Placement: Left of text with gap-2 spacing

### Responsive Design Breakpoints
```css
/* Breakpoints */
- Mobile: 320px - 767px (default)
- Tablet: 768px - 1023px (sm:)
- Desktop: 1024px+ (lg:)
- Wide: 1280px+ (xl:)

/* Content Priorities */
- Mobile: Essential content only
- Tablet: Add secondary content
- Desktop: Full feature set
```

### Performance Guidelines
- Lazy load images below the fold
- Use Next.js Image component for optimization
- Minimize CSS classes per element
- Avoid deep nesting in components
- Use CSS Grid/Flexbox over absolute positioning

### Accessibility Requirements
- Minimum touch target: 44x44px
- Color contrast: 4.5:1 for normal text, 3:1 for large text
- Focus indicators on all interactive elements
- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support

## Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow existing ESLint and Prettier configurations
- Use functional components with hooks
- Implement proper error handling and loading states

### Mobile-First Development
- Design for mobile screens first (320px+)
- Use responsive breakpoints: mobile (320px), tablet (768px), desktop (1024px)
- Implement touch-friendly interactions
- Test on actual mobile devices

### API Design
- RESTful API principles
- Proper HTTP status codes and error handling
- Database transactions for multi-step operations
- Supabase RLS for security

### Component Architecture
- Reusable UI components in `/components/ui`
- Feature-specific components in domain folders
- Proper prop types and TypeScript interfaces
- Separate business logic from presentation

## Important Notes

### 🚨 TypeScript Type Safety (CRITICAL - Vercel Deployment Will FAIL)
#### **MANDATORY: ZERO TypeScript Errors Policy**
- **TypeScript errors = Vercel deployment FAILURE = Production DOWN**
- **ALWAYS run `npm run type-check` BEFORE EVERY commit**
- **NEVER push code with ANY TypeScript errors**
- **NEVER use @ts-ignore, @ts-nocheck, or any type suppression**
- **ALWAYS fix type errors immediately when detected**

#### Type Safety Requirements
- Properly type ALL function parameters and return values
- Type ALL API responses with explicit interfaces
- Type ALL database queries and Supabase responses
- Use `as any` ONLY as temporary solution with TODO comment
- When using Supabase joins, use profiles table instead of auth.users
- Handle nullable/undefined values explicitly

#### Common Type Error Solutions
- Set iteration: Use `Array.from(new Set())` instead of `[...new Set()]`
- Supabase responses: Cast with `(data as any)` when type inference fails
- Unknown types: Define proper interfaces instead of using `any`

#### Pre-Commit Checklist
```bash
npm run type-check  # MUST show 0 errors
npm run lint        # Fix all linting issues
npm run build       # Ensure build succeeds
```

### Terminology Consistency
- Always use "Match" instead of "Tournament" in new code
- Database tables may still use legacy names but application layer uses "match"
- UI text should consistently use "경기" (match) terminology

### Supabase Configuration
- Environment variables required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Helper functions available in `src/lib/supabase.ts`
- Database operations use helper functions in `db` object

### Cost Optimization
- Built for free tier services (Supabase free, Vercel free)
- Optimized for gradual scaling
- Mobile-first approach reduces bandwidth usage

### State Management
- Use React hooks for local state
- Supabase provides real-time updates
- Authentication state managed by Supabase Auth helpers

## Testing and Quality Assurance

### 🔴 Before Committing (MANDATORY CHECKS - NO EXCEPTIONS)
#### **MUST PASS ALL CHECKS BEFORE EVERY COMMIT**
1. **`npm run type-check`** → **MUST show 0 errors** ⚠️ CRITICAL
2. **`npm run lint`** → Fix ALL linting issues
3. **`npm run build`** → MUST succeed without errors
4. Test ALL affected functionality in development
5. **REMINDER: TypeScript errors = Deployment FAILURE = Production DOWN**

#### **If ANY check fails:**
- **DO NOT COMMIT**
- **DO NOT PUSH**
- **FIX IMMEDIATELY**
- **RE-RUN ALL CHECKS**

### Development Process
- Use feature branches for development
- Follow conventional commit messages
- Review changes before merging
- Maintain development log in `DEVELOPMENT_LOG.md`

## Performance Considerations

- Next.js built-in optimizations (SSR, image optimization)
- Supabase built-in CDN for global distribution
- Proper caching strategies
- Lazy loading for images and components
- Database query optimization with proper indexing

## Git Workflow and Branch Management

### Branch Strategy
Follow the **Git Flow** pattern with Vercel auto-deployment integration:

```
main (production) → Vercel Production Deployment
├── develop (integration) → Vercel Preview Deployment  
├── feature/feature-name (feature development)
├── hotfix/issue-description (emergency fixes)
└── release/version-number (release preparation)
```

### Vercel Auto-Deployment Setup
- **Production**: `main` branch automatically deploys to production URL
- **Preview**: `develop` branch creates preview deployments for testing
- **Feature Branches**: Create individual preview URLs for code review

### Branch Naming Convention
- `feature/descriptive-name` - New features
- `bugfix/issue-description` - Bug fixes
- `hotfix/critical-issue` - Emergency production fixes
- `release/v1.0.0` - Release preparation
- `chore/maintenance-task` - Maintenance tasks

### Commit Message Convention
Use **Conventional Commits** format:
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or modifying tests
- `chore`: Build process or tool changes
- `perf`: Performance improvements

**Examples:**
```
feat(auth): add social login with Google
fix(team): resolve team deletion permission issue
docs(api): update API documentation for matches
chore(deps): update dependencies to latest versions
```

### Development Workflow

#### 1. Starting New Work (Feature Development)
```bash
# Switch to develop branch and get latest changes
git checkout develop
git pull origin develop

# Create new feature branch from develop
git checkout -b feature/descriptive-name

# Work on feature...
# Make commits as you develop
git add .
git commit -m "feat(scope): description"

# Push feature branch for backup/collaboration
git push origin feature/descriptive-name
```

#### 2. Before Committing
**🚨 MANDATORY CHECKS - RUN EVERY TIME, NO EXCEPTIONS:**
```bash
npm run type-check    # MUST PASS with 0 errors - CRITICAL!
npm run lint          # Fix all linting issues
npm run build         # Must succeed without errors

# If type-check shows ANY errors:
# 1. STOP - Do NOT commit
# 2. FIX all TypeScript errors
# 3. Re-run ALL checks
# 4. Only commit when ALL checks pass
```

#### 3. Feature Completion and Merge to Develop
```bash
# Ensure feature is complete and tested
git push origin feature/descriptive-name

# Create Pull Request to develop branch
# After review and approval, merge using squash and merge
# Delete feature branch after merge

# Alternative: Direct merge to develop (for small changes)
git checkout develop
git pull origin develop
git merge feature/descriptive-name --no-ff
git push origin develop
git branch -d feature/descriptive-name
```

#### 4. Quick Deploy to Production (Most Common)
```bash
# For quick deployment directly to production
git add .
git commit -m "perf: optimize API performance and database queries"
git push origin main

# This automatically triggers Vercel production deployment
```

#### 5. Feature Branch Workflow
```bash
# When develop branch is stable and ready for production
git checkout main
git pull origin main
git merge develop --no-ff
git push origin main

# This automatically triggers Vercel production deployment
# Tag the release for version tracking
git tag v1.0.0
git push origin --tags
```

#### 6. Development Environment Setup
```bash
# Clone repository and switch to develop
git clone <repository-url>
cd the_match
git checkout develop

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development
npm run dev
```

### Branch Protection Rules
- **main**: Protected, requires PR, requires status checks, triggers production deployment
- **develop**: Protected, requires PR, allows admin push, creates preview deployments
- **feature/***: No protection, creates individual preview deployments, delete after merge
- **hotfix/***: Emergency fixes, merge to main after review, immediate deployment

### Deployment Guidelines

#### Vercel Deployment Environments
1. **Production** (main branch)
   - Automatic deployment on push to main
   - Production database (Supabase production)
   - Custom domain (if configured)
   - Requires thorough testing before deployment

2. **Preview** (develop branch)
   - Automatic preview deployment on push to develop
   - Preview database or staging environment
   - Used for integration testing and stakeholder review

3. **Feature Previews** (feature branches)
   - Individual preview URLs for each feature branch
   - Useful for code review and feature demonstration
   - Automatically deleted when branch is deleted

#### Deployment Checklist
**Before merging to main:**
- [ ] All tests pass (`npm run test:e2e`)
- [ ] Build succeeds (`npm run build`)
- [ ] Code quality checks pass (`npm run lint`, `npm run type-check`)
- [ ] Feature tested on develop branch preview
- [ ] Database migrations applied (if any)
- [ ] Environment variables updated (if needed)
- [ ] Documentation updated

### Pull Request Guidelines
1. **Title**: Clear, descriptive title following commit convention
2. **Description**: 
   - What was changed and why
   - Link to related issues
   - Testing instructions
   - Screenshots (if UI changes)
3. **Reviewers**: At least one reviewer required
4. **Checks**: All CI checks must pass
5. **Merge**: Use "Squash and merge" to keep history clean

### Emergency Procedures
For critical production issues:
1. Create `hotfix/description` branch from `main`
2. Fix the issue with minimal changes
3. Test thoroughly
4. Create PR to both `main` and `develop`
5. Deploy immediately after merge
6. Tag with patch version

### File Management
- **Never commit**: `.env.local`, `node_modules/`, `.next/`, temporary files
- **Always review**: Changes to config files, dependencies, API routes
- **Clean up**: Delete merged branches, unused files, commented code

### Collaboration Guidelines
- **Communication**: Use clear commit messages and PR descriptions
- **Code Review**: Focus on logic, security, performance, and maintainability
- **Conflicts**: Resolve conflicts promptly, prefer rebase over merge
- **Documentation**: Update README and CLAUDE.md when adding features

## AI Collaboration with Gemini CLI

### Strategic AI Consultation Approach
This project integrates with Gemini CLI for **strategic AI consultation** rather than continuous collaboration. Use Gemini CLI selectively for critical decision points and complex problem-solving to maximize development efficiency.

### Setting Up Gemini CLI
To enhance development productivity, this project integrates with Gemini CLI for AI-assisted analysis and problem-solving.

#### Installation and Setup
```bash
# Install Gemini CLI (if not already installed)
npm install -g @google-ai/generativelanguage

# Verify installation
gemini --version

# Set up authentication (follow official Google AI documentation)
# Configure API key in your environment
```

#### When to Use Gemini CLI
**Use strategically for high-impact decisions:**

**✅ Recommended Use Cases:**
- Complex architectural decisions (server/client component patterns, state management)
- Performance optimization strategies (when facing specific bottlenecks)
- Advanced technical problem-solving (unusual errors, complex integrations)
- Code review of critical components before major releases
- Technology stack decisions (choosing libraries, frameworks)

**❌ Avoid Using For:**
- Simple syntax questions (use documentation instead)
- Basic debugging (try direct problem-solving first)
- Routine development tasks (standard CRUD operations)
- Frequent consultation on minor decisions

#### Usage Patterns
Use Gemini CLI for strategic development consultation in these scenarios:

**1. Technical Analysis and Discussion**
```bash
echo "How can I improve React component performance in this Next.js app?" | gemini
echo "What are the best practices for Supabase Row Level Security?" | gemini
echo "How to optimize TypeScript types for better performance?" | gemini
```

**2. Code Review and Error Analysis**
```bash
# Analyze build errors
echo "I'm getting this TypeScript error: [paste error here]. How to fix it?" | gemini

# Performance optimization consultation
echo "This React component is re-rendering too often. What optimization techniques should I apply?" | gemini

# Architecture decisions
echo "Should I use React Server Components or Client Components for this feature?" | gemini
```

**3. Problem-Solving Workflow**
```bash
# Before implementing complex features
echo "I need to implement real-time match updates. What's the best approach with Supabase?" | gemini

# When debugging issues
echo "My useEffect is causing infinite loops. What are the common causes and solutions?" | gemini

# For code quality improvements
echo "How can I improve the type safety of this API endpoint?" | gemini
```

### Strategic Integration with Development Workflow

#### 1. Pre-Development Consultation (Major Features Only)
Before starting complex new features or making architectural changes:
```bash
# Get architectural guidance
echo "Planning to add [feature description]. What's the best approach considering our tech stack?" | gemini

# Understand best practices
echo "What are the latest React 18 + Next.js 14 best practices for [specific area]?" | gemini
```

#### 2. During Development (Complex Issues Only)
When facing significant technical challenges or roadblocks:
```bash
# Get quick solutions
echo "I'm stuck with [specific problem]. What are possible solutions?" | gemini

# Validate approaches
echo "Is this the right way to implement [feature] in our React/Next.js app?" | gemini
```

#### 3. Code Review Enhancement (Critical Components Only)
Before committing major features or performance-critical code:
```bash
# Performance analysis
echo "Review this component for performance issues: [paste code]" | gemini

# Security review
echo "Are there any security concerns with this API implementation?" | gemini
```

#### 4. Error Resolution
When encountering issues:
```bash
# Build errors
echo "Getting build error: [error message]. How to resolve?" | gemini

# Runtime issues
echo "Application behaving unexpectedly: [describe issue]. Debugging approach?" | gemini
```

### Best Practices for Gemini Collaboration

#### 1. Provide Context
Always include relevant context in your queries:
```bash
# Good: Specific to our stack
echo "In Next.js 14 with App Router and TypeScript, how should I handle form validation?" | gemini

# Better: Include our specific constraints
echo "For our React tournament app using Supabase, what's the best way to implement real-time updates?" | gemini
```

#### 2. Iterative Problem Solving
Use Gemini for step-by-step analysis:
```bash
# Step 1: Understand the problem
echo "Explain the performance implications of [specific code pattern]" | gemini

# Step 2: Get solutions
echo "Based on the performance issues, what are the recommended solutions?" | gemini

# Step 3: Implementation guidance
echo "How to implement [chosen solution] in our Next.js app?" | gemini
```

#### 3. Code Quality Focus
Regular quality checks:
```bash
# Type safety
echo "How to improve TypeScript type safety for this API response?" | gemini

# Performance
echo "Are there performance bottlenecks in this component pattern?" | gemini

# Best practices
echo "Does this code follow React 18 + Next.js 14 best practices?" | gemini
```

### Common Use Cases

#### React/Next.js Development
- Component optimization strategies
- Hook usage patterns and best practices
- State management decisions
- Performance debugging
- Server vs Client component decisions

#### Supabase Integration
- Database schema optimization
- Row Level Security implementation
- Real-time subscription patterns
- Authentication flow improvements

#### TypeScript Enhancement
- Type definition improvements
- Generic type usage
- API response typing
- Error handling patterns

#### Performance Optimization
- Bundle size analysis
- Rendering optimization
- Database query optimization
- Caching strategies

### Gemini CLI Commands Reference

#### Basic Usage
```bash
# Simple question
echo "question" | gemini

# Multi-line input
gemini << EOF
Complex question or
code snippet for analysis
EOF

# File analysis
cat src/components/SomeComponent.tsx | gemini
```

#### Advanced Usage
```bash
# Combine with other tools
npm run build 2>&1 | gemini  # Analyze build output
npm run test 2>&1 | gemini   # Analyze test results
```

### Integration Examples

#### Example 1: Performance Analysis
```bash
# Before optimization
echo "This component re-renders frequently. Analyze for optimization opportunities:" | gemini

# After receiving suggestions, implement and verify
echo "Implemented useMemo and useCallback. Are there other optimizations?" | gemini
```

#### Example 2: Architecture Decisions
```bash
# Planning new feature
echo "Need to add match bracket visualization. React library recommendations?" | gemini

# Implementation approach
echo "Chosen library X for brackets. Best integration pattern with Next.js?" | gemini
```

#### Example 3: Error Resolution
```bash
# When stuck
echo "Getting hydration mismatch in Next.js. Common causes and solutions?" | gemini

# Follow-up
echo "Applied server-side rendering fix. How to prevent future hydration issues?" | gemini
```

### Performance Evaluation Results

**Technical Quality**: ⭐⭐⭐⭐⭐ (5/5) - Excellent technical insights and practical solutions
**Stability**: ⭐⭐⭐ (3/5) - Occasional connection timeouts and MCP errors
**Practical Value**: ⭐⭐⭐⭐ (4/5) - High value for complex decisions, less suited for routine tasks

### Strategic Usage Guidelines

**Best Practice**: Use Gemini CLI as a **strategic consulting tool** for:
- Making informed architectural decisions
- Solving complex technical challenges
- Reviewing critical code before major releases
- Optimizing performance bottlenecks

**Efficiency Tip**: Focus on quality over quantity - one well-targeted consultation is more valuable than multiple routine queries.

This strategic AI consultation approach ensures optimal use of development time while leveraging AI expertise for maximum impact on code quality and architecture decisions.