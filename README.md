# The Match 🏆

토너먼트 및 리그 관리 플랫폼 - 다양한 스포츠 경기의 대진표 생성, 팀 관리, 경기 결과 추적을 제공하는 모바일 최적화 웹 서비스

## 🚀 주요 기능

### Phase 1 (MVP)
- 🔐 사용자 인증 (이메일/소셜 로그인)
- 🏁 기본 토너먼트 생성 및 관리
- 👥 팀/선수 등록 및 관리
- 📊 대진표 생성 및 경기 결과 입력
- 📱 모바일 최적화 반응형 UI

### Phase 2 (고급 기능)
- 🎯 다양한 토너먼트 형식 (더블 엘리미네이션, 라운드 로빈)
- 🖼️ 팀/선수 프로필 이미지 업로드
- 📅 경기 일정 관리
- 📈 기본 통계 및 순위표
- 🔍 토너먼트 검색 및 필터링

### Phase 3 (소셜 기능)
- 📸 경기 사진/영상 업로드
- 🎨 팀 갤러리 및 하이라이트
- 💬 댓글 및 반응 시스템
- 👥 팀 팔로우 기능

## 🛠️ 기술 스택

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Deployment**: Vercel

## 🚀 시작하기

### 필수 조건
- Node.js 18 이상
- pnpm (권장) 또는 npm
- Supabase 계정

### 설치 및 실행

1. **프로젝트 클론**
   ```bash
   git clone https://github.com/your-username/the-match.git
   cd the-match
   ```

2. **의존성 설치**
   ```bash
   pnpm install
   # 또는
   npm install
   ```

3. **환경 변수 설정**
   프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가:
   ```bash
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   
   # Optional: For local development
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   
   # Next.js Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-nextauth-secret
   ```

4. **Supabase 로컬 개발 환경 시작**
   ```bash
   pnpm supabase:start
   ```

5. **개발 서버 실행**
   ```bash
   pnpm dev
   ```

   브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인하세요.

## 📁 프로젝트 구조

```
src/
├── app/                 # Next.js 13+ App Router
│   ├── (auth)/         # 인증 관련 페이지
│   ├── tournament/     # 토너먼트 페이지
│   ├── api/           # API 라우트
│   └── globals.css    # 전역 스타일
├── components/         # 재사용 컴포넌트
│   ├── ui/            # 기본 UI 컴포넌트
│   ├── tournament/    # 토너먼트 컴포넌트
│   └── team/          # 팀 관련 컴포넌트
├── lib/               # 유틸리티 함수
├── hooks/             # 커스텀 훅
├── types/             # TypeScript 타입
└── utils/             # 헬퍼 함수
```

## 🔧 개발 스크립트

- `pnpm dev` - 개발 서버 실행
- `pnpm build` - 프로덕션 빌드
- `pnpm start` - 프로덕션 서버 실행
- `pnpm lint` - ESLint 검사
- `pnpm type-check` - TypeScript 타입 검사
- `pnpm format` - Prettier 포맷팅
- `pnpm supabase:start` - Supabase 로컬 환경 시작
- `pnpm supabase:stop` - Supabase 로컬 환경 중지
- `pnpm supabase:reset` - 데이터베이스 리셋
- `pnpm supabase:gen-types` - Supabase 타입 생성

## 📊 비용 최적화

### 무료 티어 활용
- **Supabase 무료**: 500MB 데이터베이스, 1GB 스토리지
- **Vercel 무료**: 100GB 대역폭, 무제한 정적 사이트
- **GitHub**: 무료 코드 저장소

### 성장 단계별 비용
1. **Phase 1**: $0/월 (무료 티어만 사용)
2. **Phase 2**: ~$25/월 (Supabase Pro)
3. **Phase 3**: 필요에 따라 점진적 확장

## 🎨 UI/UX 가이드라인

- **모바일 우선 설계**: 320px부터 시작
- **터치 최적화**: 최소 44px 터치 영역
- **접근성**: WCAG 2.1 AA 준수
- **성능**: 3초 이내 로딩 시간
- **일관성**: 통일된 디자인 시스템

## 🔒 보안

- Supabase RLS (Row Level Security) 활용
- JWT 토큰 기반 인증
- 입력 데이터 검증
- 이미지 업로드 보안 검사

## 🤝 기여하기

1. Fork 생성
2. Feature 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 Push (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 문의

- 프로젝트 링크: [https://github.com/your-username/the-match](https://github.com/your-username/the-match)
- 이슈 리포트: [GitHub Issues](https://github.com/your-username/the-match/issues)

---

**The Match** - 모든 스포츠 경기를 위한 완벽한 토너먼트 관리 솔루션 🏆 