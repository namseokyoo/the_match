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
**ALWAYS run these checks:**
```bash
npm run lint          # Check code style
npm run type-check    # Verify TypeScript types
npm run build         # Ensure build works
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

#### 4. Automatic Deployment to Production
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

#### 5. Development Environment Setup
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