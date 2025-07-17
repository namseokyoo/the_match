# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

### Before Committing
1. Run `pnpm lint` to check code style
2. Run `pnpm type-check` to verify TypeScript types
3. Run `pnpm build` to ensure production build works
4. Test functionality in development environment

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
Follow the **Git Flow** pattern with simplified approach:

```
main (production)
├── develop (integration)
├── feature/feature-name (feature development)
├── hotfix/issue-description (emergency fixes)
└── release/version-number (release preparation)
```

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

#### 1. Starting New Work
```bash
# Update develop branch
git checkout develop
git pull origin develop

# Create new feature branch
git checkout -b feature/descriptive-name

# Work on feature...
git add .
git commit -m "feat(scope): description"
```

#### 2. Before Committing
**ALWAYS run these checks:**
```bash
npm run lint          # Check code style
npm run type-check    # Verify TypeScript types
npm run build         # Ensure build works
```

#### 3. Merging Work
```bash
# Push feature branch
git push origin feature/descriptive-name

# Create Pull Request to develop
# After review and approval, merge using squash and merge
# Delete feature branch after merge
```

#### 4. Release Process
```bash
# Create release branch from develop
git checkout -b release/v1.0.0 develop

# Final testing and bug fixes
# Update version numbers
# Merge to main and develop
# Tag the release
git tag v1.0.0
```

### Branch Protection Rules
- **main**: Protected, requires PR, requires status checks
- **develop**: Protected, requires PR, allows admin push
- **feature/***: No protection, delete after merge
- **hotfix/***: Allowed to merge directly to main after review

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