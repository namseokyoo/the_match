# The Match - E2E Testing Documentation

## 📊 테스트 현황
- **전체 시나리오**: 12개
- **통과율**: 75% (9/12 통과)
- **자동화**: GitHub Actions CI/CD 파이프라인 구축 완료

## 🎯 테스트 시나리오

### ✅ 통과한 테스트 (9개)
1. **회원가입 프로세스**: 회원가입 및 자동 로그인
2. **로그인 및 로그아웃**: 인증 플로우 검증
3. **선수 추가**: 팀 선수 관리 기능
4. **경기 참가 신청**: 매치 참가 시스템
5. **경기 목록 및 검색**: 매치 조회 기능
6. **팀 목록 조회**: 팀 리스트 표시
7. **프로필 관리**: 사용자 프로필 수정
8. **대시보드 기능**: 대시보드 섹션 표시
9. **모바일 반응형**: 모바일 UI 테스트

### ❌ 실패한 테스트 (3개)
1. **팀 생성 및 관리**: 페이지 접근 타임아웃
2. **경기 생성 (리그전)**: 페이지 접근 타임아웃
3. **경기 생성 (토너먼트)**: 페이지 접근 타임아웃

## 🚀 테스트 실행 방법

### 로컬 환경

```bash
# 모든 테스트 실행
pnpm test:e2e

# 특정 브라우저만 테스트
pnpm test:e2e:chromium
pnpm test:e2e:firefox
pnpm test:e2e:webkit

# 모바일 테스트
pnpm test:e2e:mobile

# UI 모드로 테스트 (디버깅용)
pnpm test:e2e:ui

# 헤드리스 모드 해제 (브라우저 표시)
pnpm test:e2e:headed

# 디버그 모드
pnpm test:e2e:debug

# 테스트 리포트 확인
pnpm test:e2e:report
```

### CI/CD 환경

GitHub Actions에서 자동으로 실행됩니다:
- **Push to main/develop**: 자동 테스트 실행
- **Pull Request**: PR 검증 테스트
- **Daily Schedule**: 매일 오전 9시 (KST) 정기 테스트

## 🔧 최근 개선사항

### 인증 시스템
- ✅ 이메일 중복 검사 강화
- ✅ 회원가입 후 자동 로그인
- ✅ 통합 인증 Hook (`useRequireAuth`) 구현
- ✅ 페이지별 인증 미들웨어 일관성 확보

### 테스트 코드
- ✅ Placeholder 텍스트 정확한 매칭
- ✅ 요소 선택자 중복 문제 해결
- ✅ 모바일 반응형 테스트 개선
- ✅ 대시보드 섹션 확인 로직 개선

### CI/CD
- ✅ GitHub Actions 워크플로우 구성
- ✅ 멀티 브라우저 테스트 (Chromium, Firefox, WebKit)
- ✅ 테스트 결과 아티팩트 저장
- ✅ PR 자동 코멘트 기능

## 📝 알려진 이슈

### 타임아웃 이슈
- **원인**: 로그인 후 페이지 리다이렉션 로직
- **영향**: 팀/경기 생성 페이지 접근 시 30초 타임아웃
- **해결방안**: `useRequireAuth` Hook 적용 완료, 추가 모니터링 필요

### 테스트 데이터
- 테스트 시 매번 새로운 이메일 생성 (타임스탬프 활용)
- Supabase 테스트 환경 분리 검토 필요

## 🔍 테스트 결과 분석

### 성공 패턴
- 정적 페이지 접근: 100% 성공
- API 통신: 인증 토큰 포함 시 성공
- UI 상호작용: 선택자 정확 시 성공

### 실패 패턴
- 동적 리다이렉션: useEffect 기반 리다이렉션 타이밍 이슈
- 페이지 로딩: 인증 체크 후 렌더링 지연

## 📈 향후 계획

1. **테스트 환경 개선**
   - [ ] Supabase 테스트 환경 분리
   - [ ] 테스트 데이터 시딩 자동화
   - [ ] 테스트 후 데이터 정리 스크립트

2. **테스트 커버리지 확대**
   - [ ] API 엔드포인트 단위 테스트
   - [ ] 컴포넌트 단위 테스트
   - [ ] 통합 테스트 시나리오 추가

3. **성능 최적화**
   - [ ] 병렬 테스트 실행 최적화
   - [ ] 테스트 실행 시간 단축
   - [ ] 리소스 사용량 모니터링

## 🛠️ 트러블슈팅

### 로컬 테스트 실패 시
1. 환경 변수 확인: `.env.local` 파일 존재 여부
2. Supabase 연결 확인: URL과 API Key 유효성
3. 포트 충돌 확인: 3000번 포트 사용 중인지 확인
4. 브라우저 설치: `npx playwright install`

### CI 테스트 실패 시
1. GitHub Secrets 설정 확인
2. 빌드 로그 확인
3. 테스트 아티팩트 다운로드 및 분석
4. 스크린샷 확인 (실패 시 자동 캡처)

## 📚 참고 자료
- [Playwright Documentation](https://playwright.dev/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Next.js Testing](https://nextjs.org/docs/testing)