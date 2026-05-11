# PanTrKa 개발 워크플로우 (v2)

> 2026-05-05 개편. 구버전(Web chat + PROJECT.md 동기화 기반)은
> `Obsidian Vault/99_Archive/shopify-clone-old-context/WORKFLOW_v1_2024style.md` 참고.

---

## 핵심 원칙

- **설계·실행 모두 Claude Code에서** — Web chat은 워크플로우에서 제거 (모바일 등 부수 용도만)
- **plan mode가 설계자** — Shift+Tab으로 진입, Plan 서브에이전트가 설계안 제시
- **3마디 패턴**: "오늘 할 작업 알려줘" / `/save` / `/wrap-up`
- **자동화 L0 유지** — hooks 도입 안 함. 수동 commit·push
- **커밋은 작은 단위 + 한글 메시지** (글로벌 [CLAUDE.md](C:\Users\KYW\.claude\CLAUDE.md))

---

## 전체 흐름 (3단계)

### 1단계 — 작업 시작

```
Claude Code 실행
   ↓ 자동 로드: 루트 CLAUDE.md + MEMORY.md 인덱스
   ↓
"오늘 할 작업 알려줘"
   ↓ Claude가 MEMORY.md → project_roadmap.md 자동 참조
   ↓ 우선순위 안내 → 사용자 선택
   ↓
Shift+Tab → plan mode 진입
   ↓ Explore 서브에이전트 자동 호출 (코드 탐색)
   ↓ Plan 서브에이전트 자동 호출 (설계)
   ↓
사용자 승인 → ExitPlanMode → 실행 단계 진입
```

### 2단계 — 실행 + 작은 단위 commit

```
Claude가 단계별 변경 진행
   ↓
변경 묶음 단위로 사용자가 git add/commit (수동, 한글 메시지)
   ↓
commit 후 → /save → /clear (반복)
```

`/save` (가벼운 체크포인트, 30초~1분):
- git status 확인
- 이번 세션 변경 요약
- `project_roadmap.md` 영향 분석 (완료 항목 제거 / 새 이슈 추가)
- /clear 안전 신호로 종료

### 3단계 — 하루 마무리 / 큰 마일스톤

```
/wrap-up (5~10분)
   ↓ last-wrapup-time 이후 git log 분석
   ↓ project_roadmap.md 갱신 (해결된 이슈 제거)
   ↓ 모든 CLAUDE.md (루트·backend·frontend) 영향 검토 + 200줄 한도 체크
   ↓ docs/API_REFERENCE.md 갱신 검토 (새 endpoint 시)
   ↓ Obsidian 일일 로그 작성 (vault/10_Projects/shopify-clone/work-log/YYYY-MM-DD.md)
   ↓ last-wrapup-time 갱신
   ↓ push 안 된 커밋 push 제안
```

---

## 컨텍스트 파일 지도

### 매 세션 자동 로드
| 파일 | 위치 | 역할 |
|---|---|---|
| 글로벌 CLAUDE.md | `~/.claude/CLAUDE.md` | 모든 프로젝트 공통 (커밋 한글, 작은 단위 등) |
| 루트 CLAUDE.md | `shopify-clone/CLAUDE.md` | 프로젝트 개요, 공통 패턴, 비즈니스 룰 |
| MEMORY.md | `~/.claude/projects/.../memory/MEMORY.md` | auto-memory 인덱스 (200줄 제한) |

### 도메인 작업 시 lazy load
| 파일 | 위치 | 트리거 |
|---|---|---|
| backend/CLAUDE.md | `shopify-clone/backend/CLAUDE.md` | backend/ 파일 작업 시 |
| frontend/CLAUDE.md | `shopify-clone/frontend/CLAUDE.md` | frontend/ 파일 작업 시 |

### 인덱스에 등록 — 필요 시 Claude가 Read
| 파일 | 위치 | 발견 경로 |
|---|---|---|
| project_roadmap.md | `~/.claude/projects/.../memory/project_roadmap.md` | MEMORY.md 인덱스 한 줄 |
| docs/API_REFERENCE.md | `shopify-clone/docs/API_REFERENCE.md` | 루트 CLAUDE.md 한 줄 힌트 |
| docs/VERIFICATION_LOG.md | `shopify-clone/docs/VERIFICATION_LOG.md` | 루트 CLAUDE.md 한 줄 힌트 |

### 슬래시 스킬 (자동 발동 + `/이름` 호출)
| 파일 | 위치 | 호출 |
|---|---|---|
| /save | `shopify-clone/.claude/skills/save/SKILL.md` | "/save", "잠깐 정리" 등 |
| /wrap-up | `shopify-clone/.claude/skills/wrap-up/SKILL.md` | "/wrap-up", "오늘 작업 정리해줘" 등 |

---

## 컨텍스트 손실 방어 (4채널)

`/clear`로 세션을 비워도 다음 세션이 stale 없이 시작되도록:

| 채널 | 메커니즘 |
|---|---|
| A | `/save` → `/clear` 패턴 (작업 단위) |
| B | git 커밋 메시지(한글) + diff = 영구 진실 소스. `/wrap-up`이 자동 수집 |
| C | auto-memory 누적 (Claude 내장) |

`/save`를 깜빡해도 채널 B+C가 백업.

---

## 유지보수 룰

### 갱신 책임
| 파일 | 갱신 주체 | 시점 |
|---|---|---|
| project_roadmap.md | `/save`, `/wrap-up` | 작업 단위 / 하루 끝 |
| 루트 CLAUDE.md | `/wrap-up` 또는 수동 | 도메인 패턴 변경 시 |
| backend/CLAUDE.md | `/wrap-up` 또는 수동 | backend 도메인 변경 시 |
| frontend/CLAUDE.md | `/wrap-up` 또는 수동 | frontend 도메인 변경 시 |
| docs/API_REFERENCE.md | `/wrap-up` 또는 수동 | 새 endpoint 시 |
| docs/VERIFICATION_LOG.md | 수동 | 검증 트랙 결과 / 영구 이슈 발견 |
| Obsidian 일일 로그 | `/wrap-up` | 하루 끝 |

### 200줄 한도 (CLAUDE.md)
- `/wrap-up`이 갱신 전 줄 수 체크
- 초과 예상 시 자동 수정 X → 사용자 3택 보고 (분리 / 정리 / 무시)
- 현재 상태: 루트 123 / backend 194 (한도 근접 ⚠️) / frontend 167

### 폐기된 패턴
- ❌ `PROJECT.md` 수동 동기화 (Phase 5에서 archive 후 삭제됨)
- ❌ Web chat에서 프롬프트 작성 (plan mode가 대체)
- ❌ 작업 끝마다 4파일 동기화 프롬프트

---

## 자주 쓰는 명령

```powershell
# 인프라 (루트에서)
docker compose up -d

# 백엔드 (cd backend 후)
.\gradlew bootRun    # 포트 8080
.\gradlew test       # 테스트 27개

# 프론트엔드 (cd frontend 후)
npm run dev          # 포트 3000
npx tsc --noEmit     # 타입 체크
```

---

## 향후 도입 후보 (현재 보류)

- **PostToolUse hook**: Edit/Write 후 typecheck 자동 실행 (가장 ROI 높음)
- **PreToolUse hook**: `.env` 직접 수정 차단
- **Stop hook**: uncommitted 변경 commit 알림
- **Routines**: cron·GitHub event 기반 야간 자동화

도입 시점은 워크플로우 안정화 후 필요 발생 시.
