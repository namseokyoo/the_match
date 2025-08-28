# The Match Design Guide

## 🎯 Design Philosophy

**Core Principle: Mobile-First Minimalism**

The Match 서비스는 모바일 환경에서 최적의 사용성을 제공하기 위해 설계되었습니다. 정보 밀도를 높이고 불필요한 장식을 제거하여 콘텐츠에 집중할 수 있도록 합니다.

### Design Principles
1. **Information Density** - 화면당 6-8개 아이템 표시 목표
2. **Visual Hierarchy** - 명확한 시각적 우선순위
3. **Consistency** - 일관된 디자인 패턴
4. **Performance** - 빠른 로딩과 부드러운 인터랙션
5. **Accessibility** - 모든 사용자가 접근 가능

## 📐 Layout System

### Grid & Spacing
- **8px Grid System** - 모든 간격은 8의 배수 사용
- **Mobile Padding**: 16px (px-4)
- **Desktop Padding**: 32px (lg:px-8)
- **Section Spacing**: 24px mobile / 32px desktop

### Container Widths
```css
/* Container Sizes */
max-w-7xl  // Main container - 1280px
max-w-4xl  // Reading content - 896px
max-w-2xl  // Forms - 672px
max-w-xl   // Modals - 576px
```

### Responsive Breakpoints
```css
/* Tailwind Breakpoints */
Mobile:  320px - 767px (default)
Tablet:  768px - 1023px (sm:)
Desktop: 1024px+ (lg:)
Wide:    1280px+ (xl:)
```

## 🎨 Color System

### Primary Palette
```css
/* Primary Colors - Limited Use */
--primary-blue: #2563EB    // Main CTAs, active states
--primary-dark: #1E40AF    // Hover states
--success-green: #10B981   // Success states
--error-red: #EF4444       // Errors, critical actions  
--warning-orange: #F59E0B  // Warnings, deadlines
```

### Neutral Palette
```css
/* Grays - Main UI Colors */
--gray-900: #111827  // Primary text
--gray-700: #374151  // Secondary text
--gray-500: #6B7280  // Tertiary text
--gray-200: #E5E7EB  // Borders
--gray-100: #F3F4F6  // Backgrounds
--gray-50: #F9FAFB   // Light backgrounds
--white: #FFFFFF     // Cards, surfaces
```

### Semantic Colors
```css
/* Status Colors - Consistent Meaning */
bg-green-50 + border-green-500   // 모집중, 활성
bg-blue-50 + border-blue-500     // 진행중
bg-gray-50 + border-gray-400     // 완료, 비활성
bg-red-50 + border-red-500       // 취소, 오류
bg-orange-50 + border-orange-500 // 경고, 마감임박
```

## 📏 Typography

### Font Scale
```css
/* Headings - Mobile First */
h1: text-2xl (24px) / lg:text-3xl (30px)
h2: text-xl (20px) / lg:text-2xl (24px)  
h3: text-lg (18px) / lg:text-xl (20px)
h4: text-base (16px) / lg:text-lg (18px)

/* Body Text */
body: text-sm (14px) / lg:text-base (16px)
small: text-xs (12px) / lg:text-sm (14px)
caption: text-xs (12px)

/* Font Weights */
font-normal: 400    // Body text
font-medium: 500    // Important text
font-semibold: 600  // Buttons, links
font-bold: 700      // Headings only
```

### Line Heights
```css
leading-tight: 1.25   // Headings
leading-snug: 1.375   // Subheadings
leading-normal: 1.5   // Body text
leading-relaxed: 1.625 // Reading content
```

## 🗂 Component Standards

### Compact Card Design
**Height Target**: ~120px (50% reduction from original)
**Padding**: 12px (p-3)
**Information Display**: Icon-based with text labels

```tsx
// CompactCard Structure
<div className="bg-white rounded-lg p-3 hover:shadow-md transition-all border-l-4 [status-color]">
  <div className="flex justify-between items-start gap-3">
    {/* Left: Core Information */}
    <div className="flex-1 min-w-0">
      {/* Title with Icon */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <h3 className="font-semibold text-sm truncate">{title}</h3>
        <span className="status-badge">{status}</span>
      </div>
      
      {/* Info Line with Icons */}
      <div className="flex items-center gap-3 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <Icon className="w-3 h-3" />
          <span>{info}</span>
        </div>
      </div>
      
      {/* Optional Progress Bar */}
      {showProgress && <ProgressBar />}
    </div>
    
    {/* Right: Action */}
    <ChevronRight className="w-4 h-4 text-gray-400" />
  </div>
</div>
```

### Traditional Card Design
**Use Case**: Detail views, forms, modals
**Padding**: 16-20px (p-4/p-5)
**Height**: Variable based on content

### Button System
```css
/* Button Variants */
.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700
  @apply px-4 py-2 rounded-lg font-medium
}

.btn-secondary {
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200
  @apply border border-gray-300
}

.btn-danger {
  @apply bg-red-500 text-white hover:bg-red-600
}

/* Button Sizes */
.btn-sm: px-3 py-1.5 text-xs
.btn-md: px-4 py-2 text-sm (default)
.btn-lg: px-6 py-3 text-base
```

### Form Elements
```css
/* Input Fields */
.input {
  @apply h-10 px-3 
  @apply border border-gray-300 rounded-lg
  @apply focus:ring-2 focus:ring-blue-500
  @apply text-sm
}

/* Select */
.select {
  @apply px-3 py-2
  @apply border border-gray-300 rounded-lg
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500
}
```

## 🎯 Information Architecture

### Progressive Disclosure
1. **Level 1**: Essential info only (title, status, key metric)
2. **Level 2**: Secondary details (date, location, participants)
3. **Level 3**: Full details (descriptions, rules, history)

### Visual Indicators
```css
/* Status Colors - Left Border */
border-l-4 border-green-500   // Active, recruiting
border-l-4 border-blue-500    // In progress
border-l-4 border-gray-400    // Completed
border-l-4 border-red-500     // Cancelled
border-l-4 border-orange-500  // Warning, deadline

/* Status Badges */
.badge {
  @apply px-2 py-0.5 rounded-full text-xs font-bold
}

.badge-today: bg-red-100 text-red-700
.badge-tomorrow: bg-orange-100 text-orange-700
.badge-upcoming: bg-blue-100 text-blue-700
.badge-past: bg-gray-100 text-gray-600
```

### Icon System
```css
/* Icon Sizes */
.icon-xs: w-3 h-3  // Inline with text
.icon-sm: w-4 h-4  // Standard size
.icon-md: w-5 h-5  // Standalone
.icon-lg: w-6 h-6  // Emphasis

/* Icon Usage */
Calendar: 📅 날짜/일정
MapPin: 📍 위치/장소
Users: 👥 참가자/멤버
Trophy: 🏆 경기/승리
ChevronRight: > 더보기
```

## 📱 Mobile Optimization

### Touch Targets
- Minimum size: 44x44px
- Spacing between targets: 8px minimum
- Clickable cards: Entire card is clickable

### Scrolling Performance
```css
/* Optimize scrolling */
.scroll-container {
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}

/* Prevent layout shifts */
.fixed-height {
  min-height: 120px;
  max-height: 120px;
}
```

### Loading States
```css
/* Skeleton Screens */
.skeleton {
  @apply animate-pulse bg-gray-200 rounded-lg
}

/* Loading Spinner */
.spinner {
  @apply animate-spin rounded-full border-b-2 border-blue-600
}
```

## ⚡ Performance Guidelines

### Image Optimization
- Use Next.js Image component
- Lazy load below fold images
- Provide width/height to prevent CLS
- Use appropriate formats (WebP, AVIF)

### CSS Optimization
```css
/* Minimize classes per element */
// Bad
<div className="flex items-center justify-between px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">

// Good - Create component class
<div className="card-container">

/* Use CSS Grid/Flexbox efficiently */
.list-container {
  @apply space-y-3  // Consistent spacing
}
```

### Animation Performance
```css
/* Use transform and opacity for animations */
.card-hover {
  transition: transform 150ms, opacity 150ms;
}

.card-hover:hover {
  transform: translateY(-2px);
}

/* Avoid animating layout properties */
// Bad: height, width, padding, margin
// Good: transform, opacity
```

## 🔧 Implementation Examples

### Compact Match Card
```tsx
<CompactMatchCard match={match}>
  - Height: ~120px
  - Padding: 12px
  - Icons: Type (🏆), Status (D-3)
  - Info line: 📅 Date, 📍 Venue, 👥 8/16
  - Progress bar for participants
  - Status color via left border
</CompactMatchCard>
```

### Compact Team Card  
```tsx
<CompactTeamCard team={team}>
  - Height: ~100px
  - Padding: 12px
  - Icons: Sport (⚽), Wins (🏆)
  - Info line: 👥 Members, 📅 Since
  - Member progress bar
  - Active status via color
</CompactTeamCard>
```

### List Container
```tsx
<div className="space-y-3">
  {items.map(item => (
    <CompactCard key={item.id} {...item} />
  ))}
</div>
```

## 📊 Design Metrics

### Target Metrics
- **Cards per screen**: 6-8 items (mobile)
- **Card height**: 100-120px
- **Loading time**: < 3s on 3G
- **Touch accuracy**: > 95%
- **Readability score**: WCAG AA

### Measurement Methods
```javascript
// Cards visible calculation
const viewportHeight = window.innerHeight;
const cardHeight = 120; // pixels
const spacing = 12; // pixels
const headerHeight = 64; // pixels
const visibleCards = Math.floor(
  (viewportHeight - headerHeight) / (cardHeight + spacing)
);
```

## 🚀 Future Enhancements

### Planned Improvements
1. **Dark Mode Support** - System preference detection
2. **Micro-interactions** - Subtle feedback animations
3. **Skeleton Screens** - Better loading states
4. **Virtual Scrolling** - For large lists
5. **Offline Support** - PWA capabilities

### Component Roadmap
- [ ] CompactPlayerCard
- [ ] CompactGameCard
- [ ] CompactStatsCard
- [ ] MiniProfile
- [ ] QuickActions

## 📝 Design Checklist

### Before Implementation
- [ ] Mobile-first approach
- [ ] Information hierarchy clear
- [ ] Touch targets ≥ 44px
- [ ] Color contrast WCAG AA
- [ ] Loading states defined

### During Development
- [ ] Use design tokens consistently
- [ ] Follow spacing grid (8px)
- [ ] Implement responsive breakpoints
- [ ] Add hover/focus states
- [ ] Test on real devices

### After Implementation
- [ ] Performance metrics met
- [ ] Accessibility tested
- [ ] Cross-browser verified
- [ ] Documentation updated
- [ ] Design system aligned

## 🔗 Related Documents
- [CLAUDE.md](./CLAUDE.md) - Development guidelines
- [README.md](./README.md) - Project overview
- [Tailwind Config](./tailwind.config.ts) - Design tokens