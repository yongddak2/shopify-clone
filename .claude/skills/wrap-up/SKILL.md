---
name: wrap-up
description: 하루 마무리·큰 마일스톤 종료 시 호출. git 분석부터 모든 CLAUDE.md 검토, Obsidian 일일 로그 작성, push 제안까지 풀 마무리. "/wrap-up", "오늘 작업 정리해줘", "마무리하자", "오늘 끝", "하루 종료" 등에 발동.
---

# /wrap-up — 하루 마무리 의식

5~10분 걸리는 무거운 마무리. 하루 끝 또는 큰 마일스톤 후 한 번 호출.
가벼운 체크포인트는 /save가 담당. 이건 종합 정리.

## 실행 순서

### 1. last-wrapup-time 읽기 + git log 분석

경로: `c:\Users\KYW\projects\shopify-clone\.claude\last-wrapup-time`

```bash
# 마지막 wrap-up 시각 읽기
cat .claude/last-wrapup-time

# 그 시각 이후의 모든 커밋
git log --since="$(cat .claude/last-wrapup-time)" --oneline
git log --since="$(cat .claude/last-wrapup-time)" --stat
```

last-wrapup-time이 없으면 "오늘 자정"부터로 fallback.

### 2. 변경 통계 정리

- 커밋 개수
- 파일 변경 통계: backend / frontend / docs / 신규 파일
- /clear가 사이에 있었어도 git에 다 남아있으니 재구성 가능

사용자에게 보고:
```
지난 wrap-up(2026-05-04 18:00) 이후:
- 커밋 5개
- backend 5 files / frontend 1 file / 신규 1 file
- 주요 변경: 운송장 검증 강화, OrderValidator 분리 리팩토링
```

### 3. project_roadmap.md 갱신

경로: `C:\Users\KYW\.claude\projects\c--Users-KYW-projects-shopify-clone\memory\project_roadmap.md`

- 이번 wrap-up 범위에서 해결된 "다음 작업" 항목 제거
- /save에서 추가된 "활성 이슈" 중 영구화된 것은 docs/VERIFICATION_LOG.md로 이관 후 제거 제안
- 새로 발견된 이슈 추가

사용자 확인 후 갱신.

### 4. 모든 CLAUDE.md 영향 분석 (git diff 기반 자동 분기)

```bash
git diff --name-only $(cat .claude/last-wrapup-time)..HEAD
```

분기 룰:
- `backend/` 파일 변경 → backend/CLAUDE.md 검토
- `frontend/` 파일 변경 → frontend/CLAUDE.md 검토
- 공통 비즈니스 룰·전역 패턴 변경 → 루트 CLAUDE.md 검토

각 CLAUDE.md에 대해:
- 새 도메인 패턴 추가됐나? (단순 버그픽스면 SKIP)
- 기존 패턴 변경됐나?
- 새 폴더·새 의존성?

### 5. 200줄 임계값 체크 ⚠️

CLAUDE.md 갱신 제안 전 줄 수 계산:
```bash
wc -l CLAUDE.md
wc -l backend/CLAUDE.md
wc -l frontend/CLAUDE.md
```

추가 후 200줄 초과 예상되면 **자동 수정 X**. 사용자에게 3택 보고:

```
⚠️ backend/CLAUDE.md 갱신 시 195 → 215줄로 한도 초과 예상

다음 중 어떻게 할까요?
1. 별도 doc로 분리 (예: docs/backend-{토픽}.md) → CLAUDE.md엔 한 줄 힌트만 남김
2. 기존 항목 중 무가치한 것 정리 후 추가
3. 그냥 추가 (한도 무시)
```

200줄 이내면 정상 갱신 제안.

### 6. docs/API_REFERENCE.md 갱신 검토

git diff에서 새 controller endpoint 추가/삭제/경로 변경 있는지 확인:
- `@RequestMapping`, `@GetMapping`, `@PostMapping` 등 매핑 어노테이션 변동
- 있으면 해당 섹션만 갱신 제안

### 7. Obsidian 일일 로그 작성

경로: `C:\Users\KYW\Documents\Obsidian Vault\10_Projects\shopify-clone\work-log\YYYY-MM-DD.md`

폴더가 없으면 생성. 같은 날짜 파일 이미 있으면 append (덮어쓰기 금지).

템플릿:
```markdown
---
date: YYYY-MM-DD
session: shopify-clone
---

# YYYY-MM-DD 작업 로그

## 처리한 작업 (N commits)
- 작업 1
- 작업 2

## 변경 통계
- backend: N files / frontend: N files / docs: N files / 신규: N files

## 학습·결정사항
- 새로 확립된 패턴
- 기술적 결정

## 다음 세션 인계
- 미진행 항목
- 의식해야 할 사항

## 관련 커밋
- {short hash}: {제목}
- ...
```

사용자에게 draft 보여주고 "이대로 작성할까요?" 확인.

### 8. last-wrapup-time 갱신

```bash
date -Iseconds > .claude/last-wrapup-time
```

ISO 8601 형식으로 현재 시각 기록. 다음 wrap-up이 이 시각부터 분석함.

### 9. push 제안

```bash
git status
git log @{u}.. --oneline 2>/dev/null
```

push 안 된 커밋 있으면 사용자에게:
```
push 안 된 커밋 N개 있습니다. push 할까요?
```

사용자가 "응"이라고 하면 push.

### 10. 종료 보고

```
🎉 오늘 마무리 완료
- 커밋 N개 정리됨
- project_roadmap.md: [갱신함 / 변경 없음]
- CLAUDE.md: [갱신함 / 변경 없음]
- API_REFERENCE.md: [갱신함 / 변경 없음]
- Obsidian 로그: vault/10_Projects/shopify-clone/work-log/YYYY-MM-DD.md
- push: [완료 / 보류]

수고하셨습니다.
```

## 중요 원칙

- **각 단계 사용자 확인** — 자동 수정하지 말고 항상 draft 보여주고 승인받기
- **200줄 한도 무조건 보고** — 절대 자동으로 한도 초과시키지 않기
- **Obsidian 같은 날 파일은 append** — 덮어쓰기 금지 (그날 오전·오후 wrap-up 분리 가능성)
- **last-wrapup-time은 마지막에 갱신** — 모든 단계 성공 후
- **commit 메시지는 한글** (글로벌 CLAUDE.md 규칙)
- **push는 사용자 명시 승인 후에만** — 절대 자동 push 금지
- **/clear 후에도 안전** — 컨텍스트가 비어있어도 git log + auto-memory + 글로벌 규칙으로 재구성 가능

## 컨텍스트 손실 방어

이 스킬은 /clear가 사이에 일어났어도 동작해야 함:
- git log + diff = 영구 진실 소스
- last-wrapup-time = 분석 범위 기준점
- auto-memory의 누적 학습이 보조

따라서 사용자가 /save를 깜빡하고 /clear 했어도 /wrap-up이 git을 통해 재구성 가능. 단, /save를 통해 누적된 project_roadmap.md 메모가 있으면 더 정확.
