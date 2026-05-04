---
name: save
description: 작업 단위 가벼운 체크포인트. /clear 직전에 호출. project_roadmap.md만 갱신. "/save", "잠깐 정리", "컨텍스트 저장", "체크포인트", "클리어 전 정리" 등에 발동.
---

# /save — 가벼운 체크포인트

작업 단위(보통 commit 직후) /clear 하기 전에 호출되는 가벼운 정리 스킬.
30초~1분 안에 끝나야 함. 무거운 작업은 /wrap-up이 담당.

## 적용 범위

- ✅ project_roadmap.md 갱신 (필요 시)
- ❌ CLAUDE.md 갱신 안 함 (그건 /wrap-up 소관)
- ❌ docs/API_REFERENCE.md 갱신 안 함 (/wrap-up 소관)
- ❌ Obsidian 로그 안 씀 (/wrap-up 소관)
- ❌ git push 안 함 (/wrap-up 소관)
- ❌ last-wrapup-time 갱신 안 함 (/wrap-up만)

## 실행 순서

### 1. git status 확인

```bash
git status
git log -3 --oneline
```

이번 세션에서 commit이 되었는지, 어떤 파일이 변경되었는지 파악.

### 2. 이번 세션 변경 요약 (3-5줄)

대화 컨텍스트를 토대로 이번 세션에서 한 일을 짧게 정리. 사용자에게 요약 보고.

예시:
```
이번 세션 요약:
- 운송장 번호 검증 정규식 추가 (영문+숫자 12-20자)
- OrderValidator에 메서드 1개 추가
- 커밋: a1b2c3d
```

### 3. project_roadmap.md 영향 분석

경로: `C:\Users\KYW\.claude\projects\c--Users-KYW-projects-shopify-clone\memory\project_roadmap.md`

분석 항목:
- **완료 항목 있나?** "다음 작업 (우선순위)" 목록 중 이번 세션에 끝낸 것 있으면 제거 후보로 표시
- **새 이슈 발견?** 작업 중 발견한 새 이슈/주의사항 있으면 "활성 이슈"에 추가 후보로 표시
- **우선순위 변동?** 발견 사항으로 인해 순서 바뀔 일 있는지

### 4. 사용자 확인 후 갱신

다음과 같은 형식으로 보고:

```
📝 project_roadmap.md 갱신 제안:

[제거 후보]
- "운영자 요구사항 수집·반영" → 이번 세션과 무관, 유지

[추가 후보]
- 활성 이슈에 추가: "OrderValidator 비대 (300+줄). 책임 분리 리팩토링 백로그"

이대로 갱신할까요?
```

영향이 없으면:
```
✅ project_roadmap.md 갱신 사항 없음
```

### 5. 종료 보고

```
✅ /save 완료
- 변경 파일: backend/.../OrderValidator.java (1 commit)
- project_roadmap.md: [갱신함 / 갱신 사항 없음]
- /clear 안전합니다
```

## 중요 원칙

- **빠르게 끝내기** — 사용자가 매 commit마다 부담 없이 부를 수 있어야 함
- **CLAUDE.md 건드리지 않기** — 도메인 패턴 변경이라도 /wrap-up까지 미룸. 사용자가 즉시 갱신을 원하면 명시적으로 부탁할 것
- **미확정 변경은 미루기** — 애매하면 "활성 이슈"에 표기만 해두고 /wrap-up에서 정리
- **사용자 확인 필수** — project_roadmap.md 갱신 전에 항상 "이대로 갱신할까요?" 묻기
- **commit 강제 안 함** — git status에 staged/uncommitted 있어도 /save는 정리 작업이라 commit 강요하지 않음. 단 "uncommitted 변경 있음" 알림은 줌
