# Page snapshot

```yaml
- navigation:
  - link "T The Match":
    - /url: /
  - link "경기":
    - /url: /matches
  - link "팀":
    - /url: /teams
  - link "로그인":
    - /url: /login
  - link "회원가입":
    - /url: /signup
- main:
  - img
  - heading "The Match에 로그인" [level=2]
  - paragraph: 토너먼트 관리의 새로운 경험을 시작하세요
  - heading "로그인" [level=3]
  - text: 이메일
  - textbox "이메일"
  - text: 비밀번호
  - textbox "비밀번호"
  - button:
    - img
  - button "로그인"
  - text: 또는
  - button "Google로 로그인":
    - img
    - text: Google로 로그인
  - paragraph:
    - text: 계정이 없으신가요?
    - link "회원가입":
      - /url: /signup
  - link "비밀번호를 잊으셨나요?":
    - /url: /forgot-password
- alert
```