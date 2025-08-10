# Page snapshot

```yaml
- navigation:
  - link "T The Match":
    - /url: /
  - link "경기":
    - /url: /matches
  - link "템플릿":
    - /url: /matches/templates
  - link "팀":
    - /url: /teams
  - link "선수":
    - /url: /players
  - link "통계":
    - /url: /stats
  - link "로그인":
    - /url: /login
  - link "회원가입":
    - /url: /signup
- main:
  - heading "팀 목록" [level=1]
  - paragraph: 등록된 팀들을 확인하고 관리하세요
  - button "팀 생성":
    - img
    - text: 팀 생성
  - textbox "팀 이름이나 설명으로 검색..."
  - button "검색" [disabled]:
    - img
    - text: 검색
  - text: F
  - heading "FC 서울 유나이티드" [level=3]
  - text: 선수 0명
  - paragraph: 서울 지역 축구 동호회입니다. 매주 토요일 오전에 모여서 운동합니다.
  - text: "생성일: 2025년 8월 9일"
- alert
```