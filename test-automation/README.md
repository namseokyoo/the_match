# 🤖 The Match 플랫폼 테스트 자동화 시스템

완전한 서비스 시나리오를 재현하고 지속적인 더미 데이터 생성 및 서비스 안정성 모니터링을 위한 통합 테스트 자동화 시스템입니다.

## 📋 시스템 구성

```
test-automation/
├── scenarios/                    # 테스트 시나리오 스크립트
│   ├── comprehensive-match-lifecycle.ts   # 전체 워크플로우 테스트
│   └── adaptive-bot-scenario.ts          # 적응형 봇 시나리오
├── data/                        # 테스트 데이터
│   └── extended-test-accounts.json       # 확장된 더미 계정 정보
├── results/                     # 테스트 결과 및 리포트
├── screenshots/                 # 에러 스크린샷 및 증거 자료
├── run-comprehensive-test.ts    # 메인 테스트 러너
└── README.md                    # 이 파일
```

## 🚀 테스트 시나리오

### 1. 종합 테스트 (Comprehensive Test)
**파일**: `comprehensive-match-lifecycle.ts`

**실행하는 전체 워크플로우**:
1. **계정 생성** - 20명의 다양한 역할 사용자 회원가입
2. **팀 생성** - 5개 팀 (축구, 농구, 배구, 야구, 테니스)
3. **경기 생성** - 3개 다양한 타입 경기 (토너먼트, 리그전, 더블 엘리미네이션)
4. **경기 참가** - 팀들의 경기 참가 신청
5. **팀 채팅** - 실제 메시지 전송 테스트
6. **경기 관리** - 참가자 승인/거절
7. **점수 입력** - 경기 결과 입력 및 관리

**특징**:
- 📊 상세한 성공률 분석 및 리포팅
- 📸 에러 발생 시 자동 스크린샷 캡처
- 🔄 실패 시 자동 재시도 로직
- 📋 Markdown 형식의 종합 보고서 생성

### 2. 적응형 봇 (Adaptive Bot)
**파일**: `adaptive-bot-scenario.ts`

**봇의 행동 패턴**:
- 🤖 **지능형 랜덤 액션**: 경기 탐색, 팀 관리, 프로필 업데이트, 채팅 등
- 📈 **적응형 성능 조절**: 서버 응답에 따라 요청 빈도 자동 조절
- 👥 **동시 사용자 시뮬레이션**: 여러 계정으로 동시 접속 테스트
- ⏱️ **장시간 모니터링**: 설정된 시간 동안 지속적 서비스 테스트

## 🛠️ 설치 및 설정

### 1. 의존성 설치
```bash
cd test-automation
npm install
```

### 2. 디렉토리 구조 생성
```bash
npm run setup
```

### 3. 테스트 실행

#### 전체 종합 테스트 실행
```bash
npm run test:comprehensive
```

#### 적응형 봇 실행 (10분간)
```bash
npm run test:bot
```

#### 빠른 테스트
```bash
npm run test:quick
```

## 📊 결과 분석

### 자동 생성되는 리포트
1. **JSON 결과 파일** - `results/comprehensive-test-*.json`
2. **Markdown 보고서** - `results/test-report-*.md`
3. **에러 스크린샷** - `screenshots/error-*.png`
4. **봇 세션 로그** - `results/bot-session-*.json`

### 리포트 보기
```bash
npm run report
```

### 결과 정리
```bash
npm run clean
```

## 🎯 테스트 데이터

### 테스트 계정 (20명)
- **주최자** (Organizer): 대회 생성 및 관리
- **팀장** (Captain): 팀 생성 및 팀원 관리  
- **선수** (Player): 일반 참가자

### 테스트 팀 (5개)
- 불꽃 축구단 (축구)
- 번개 농구팀 (농구)
- 태풍 배구클럽 (배구)
- 천둥 야구단 (야구)
- 폭풍 테니스팀 (테니스)

### 테스트 경기 (3개)
- 2024 신년 축구 토너먼트 (Single Elimination)
- 주말 농구 리그전 (Round Robin)
- 배구 더블 엘리미네이션 (Double Elimination)

## 🤖 봇 운영 모드

### 운영 환경별 설정

#### 개발 환경
```typescript
const bot = new AdaptiveTestBot({
    mode: 'normal',
    concurrency: 2,
    delayRange: [2000, 4000]
});
```

#### 스테이징 환경
```typescript
const bot = new AdaptiveTestBot({
    mode: 'stress',
    concurrency: 5,
    delayRange: [1000, 3000]
});
```

#### 프로덕션 모니터링
```typescript
const bot = new AdaptiveTestBot({
    mode: 'maintenance',
    concurrency: 1,
    delayRange: [5000, 10000]
});
```

## 📈 성공 기준

### 종합 테스트
- ✅ **우수**: 90% 이상 성공률
- 👍 **양호**: 70-89% 성공률
- ⚠️ **주의**: 70% 미만 성공률

### 적응형 봇
- ✅ **안정**: 에러율 10% 이하
- ⚠️ **불안정**: 에러율 20% 이상

## 🔧 고급 설정

### 환경변수
```bash
# 테스트 URL 변경
export TEST_BASE_URL=https://staging.thematch.com

# 스크린샷 비활성화
export SCREENSHOT_ON_ERROR=false

# 헤드리스 모드 비활성화 (디버깅 시)
export HEADLESS=false
```

### 커스텀 시나리오 추가
```typescript
// scenarios/custom-scenario.ts
import { AdaptiveTestBot } from './adaptive-bot-scenario';

class CustomTestBot extends AdaptiveTestBot {
    // 커스텀 로직 구현
}
```

## 📞 문제 해결

### 일반적인 문제

#### 1. 로그인 실패율 높음
**원인**: 계정이 존재하지 않거나 비밀번호 불일치
**해결**: 먼저 계정 생성 테스트 실행

#### 2. 페이지 로딩 시간 초과
**원인**: 서버 응답 속도 저하 또는 네트워크 문제
**해결**: `delayRange` 값 증가

#### 3. 요소를 찾을 수 없음
**원인**: UI 변경 또는 동적 로딩 지연
**해결**: 스크린샷 확인 후 셀렉터 업데이트

### 로그 분석
```bash
# 에러 패턴 분석
grep "❌" results/*.log | head -10

# 성공률 추이 확인
ls -la results/test-summary-*.json | tail -5
```

## 🚀 향후 확장 계획

### 1단계: 현재 (v1.0)
- ✅ 기본 워크플로우 테스트
- ✅ 적응형 봇 시스템
- ✅ 상세 리포팅

### 2단계: 고도화 (v2.0)
- 📱 모바일 반응형 테스트
- 🌐 다중 브라우저 지원
- 📊 실시간 대시보드
- 🔔 Slack/Discord 알림 연동

### 3단계: 지능화 (v3.0)
- 🧠 AI 기반 테스트 케이스 생성
- 📈 성능 저하 예측
- 🔄 자동 복구 시스템
- 📋 사용자 시나리오 학습

---

## 📜 라이선스
MIT License - 자유롭게 사용, 수정, 배포 가능

## 👥 기여하기
1. 이슈 등록 또는 기능 요청
2. Fork 후 새로운 브랜치 생성
3. 변경사항 커밋 후 Pull Request 생성

**문의**: The Match 개발팀 📧