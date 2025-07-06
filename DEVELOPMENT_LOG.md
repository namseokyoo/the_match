# The Match - 토너먼트 관리 서비스 개발 로그

## 프로젝트 개요
- 서비스명: The Match
- 설명: 토너먼트 및 경기 관리를 위한 웹 서비스
- 기술 스택: Next.js 14, TypeScript, Tailwind CSS, Supabase
- 목표: 사용자가 쉽게 토너먼트를 만들고 관리할 수 있는 플랫폼

## 최근 업데이트

### 2024년 - 용어 정리 및 대규모 리팩토링 (Tournament → Match)

**배경**: 기존에 "Tournament"로 사용되던 용어가 실제로는 개별 "경기"의 개념으로 사용되고 있었습니다. 토너먼트는 여러 경기들을 조직하는 운영 방식을 의미하므로, 의미를 명확히 하기 위해 전체 용어를 변경했습니다.

**변경 내용**:

1. **타입 정의 변경** (`src/types/index.ts`)
   - `Tournament` → `Match` (경기)
   - `TournamentType` → `MatchType` (경기 유형) 
   - `TournamentStatus` → `MatchStatus` (경기 상태)
   - `CreateTournamentForm` → `CreateMatchForm`
   - `Match` → `GameResult` (경기 내 개별 게임 결과)
   - `MatchStatus` → `GameStatus`
   - `MatchResult` → `GameDetail`

2. **API 라우트 변경**
   - `/api/tournaments` → `/api/matches`
   - `/api/tournaments/[id]` → `/api/matches/[id]`
   - 모든 API 내용에서 "토너먼트" → "경기" 변경

3. **컴포넌트 변경**
   - `src/components/tournament/` → `src/components/match/`
   - `TournamentCard` → `MatchCard`
   - `TournamentForm` → `MatchForm`
   - `TournamentList` → `MatchList`
   - `TournamentDetail` → `MatchDetail`

4. **페이지 변경**
   - `/tournaments` → `/matches`
   - `/tournaments/create` → `/matches/create`
   - `/tournaments/[id]` → `/matches/[id]`

5. **네비게이션 바 업데이트**
   - "토너먼트" 메뉴 → "경기" 메뉴
   - 링크 경로: `/tournaments` → `/matches`
   - "토너먼트 생성" 버튼 → "경기 생성" 버튼

6. **팀 관리 연동 업데이트**
   - 팀 생성/수정 시 `tournament_id` → `match_id`
   - "참가할 토너먼트" → "참가할 경기"

**기술적 특징**:
- 데이터베이스 스키마는 기존 유지 (추후 마이그레이션 예정)
- 모든 컴포넌트와 API에서 용어 일관성 확보
- Breaking changes이지만 의미적 명확성 확보
- 기존 기능 100% 호환 유지

**UX 개선**:
- 사용자에게 더 직관적인 용어 사용
- "토너먼트"와 "경기"의 개념적 혼란 해소
- 일관된 용어 사용으로 사용자 경험 향상

---

### 2024년 - 팀 관리 시스템 구현 완료

**완성된 기능**:
1. **팀 CRUD 시스템**
   - API 라우트: `/api/teams`, `/api/teams/[id]`
   - 팀 생성, 조회, 수정, 삭제 기능
   - 권한 기반 접근 제어 (팀 주장만 수정/삭제 가능)

2. **팀 관리 UI 컴포넌트**
   - `TeamCard`: 팀 정보 카드 표시
   - `TeamForm`: 팀 생성/수정 폼
   - `TeamList`: 팀 목록 및 필터링
   - `TeamDetail`: 팀 상세 정보 및 선수 관리

3. **팀 관리 페이지**
   - `/teams`: 팀 목록 (통계, 검색, 페이지네이션)
   - `/teams/create`: 팀 생성
   - `/teams/[id]`: 팀 상세 정보

4. **고급 기능**
   - 페이지네이션 및 검색
   - 경기 연동 (팀이 특정 경기에 참가)
   - 선수 관리 기초 구조
   - 권한 기반 접근 제어

---

### 2024년 - 토너먼트 관리 시스템 구현 (현재는 Match로 변경됨)

**완성된 기능**:
1. **경기 CRUD 시스템**
   - 경기 생성, 조회, 수정, 삭제
   - 다양한 경기 유형 지원 (단일 토너먼트, 더블 토너먼트, 리그전, 스위스, 리그)
   - 경기 상태 관리 (준비중, 등록중, 진행중, 완료, 취소)

2. **경기 관리 UI**
   - 경기 목록 보기 (필터링, 정렬, 검색)
   - 경기 생성/수정 폼
   - 경기 상세 정보 페이지
   - 반응형 디자인

3. **사용자 권한 관리**
   - 로그인된 사용자만 경기 생성 가능
   - 경기 생성자만 수정/삭제 가능
   - 안전한 API 접근 제어

4. **데이터 관리**
   - Supabase를 통한 실시간 데이터 동기화
   - 적절한 에러 처리 및 사용자 피드백
   - 데이터 검증 및 무결성 확보

---

### 2024년 - 초기 설정 및 기본 구조

**완성된 작업**:
1. **프로젝트 초기 설정**
   - Next.js 14 + TypeScript + Tailwind CSS 환경 구성
   - Supabase 연동 및 데이터베이스 스키마 설계
   - 기본 UI 컴포넌트 구현

2. **인증 시스템**
   - Supabase Auth를 이용한 로그인/회원가입
   - 세션 관리 및 보안 처리
   - 사용자 상태 관리

3. **네비게이션 및 레이아웃**
   - 반응형 네비게이션 바
   - 기본 페이지 레이아웃
   - 라우팅 구조 설계

## 다음 계획

### 우선순위 1: 선수 관리 세부 기능
- 선수 추가/수정/삭제 모달 구현
- 선수 포지션 및 상세 정보 관리
- 팀 내 선수 역할 설정

### 우선순위 2: 경기 참가 시스템
- 팀의 경기 참가 신청 기능
- 참가 승인/거부 시스템
- 참가팀 목록 관리

### 우선순위 3: 대진표 및 경기 운영
- 대진표 자동 생성 알고리즘
- 대진표 시각화 컴포넌트
- 경기 결과 입력 및 관리

### 우선순위 4: 사용자 경험 개선
- 실시간 알림 시스템
- 개인 대시보드
- 모바일 최적화

## 기술 노트

### 성능 최적화
- Next.js의 서버 사이드 렌더링 활용
- 이미지 최적화 및 lazy loading
- 적절한 캐싱 전략 적용

### 보안 고려사항
- Supabase RLS(Row Level Security) 정책 적용
- API 접근 권한 검증
- XSS 및 CSRF 방어

### 데이터베이스 설계
- 정규화된 관계형 데이터베이스 구조
- 인덱스 최적화로 쿼리 성능 향상
- 적절한 제약 조건으로 데이터 무결성 확보 