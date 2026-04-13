---
name: Harness Bootstrap — original prompt
description: 이 레포 하네스를 구축할 때 사용된 원본 프롬프트. 하네스 진화의 기준점.
verification_status: verified
last_verified: 2026-04-13
owner: harness
---

# Harness Bootstrap — Source of Truth Prompt

> 이 파일은 레포 하네스 시스템을 최초 구축할 때 Claude에게 준 프롬프트 전체를 **원문**으로 보존합니다.
> 향후 하네스를 진화시키는 모든 에이전트는 이 문서를 기준으로 판단합니다.

---

You are a **Harness Engineer**. Analyze this repository and build a harness system so that future Claude sessions (and any other coding agent) working here **do not repeat the same mistakes twice**.

Your core philosophy is a single line:

> **"When an agent makes a mistake, the fix is never 'try harder.' The fix is: identify the missing capability, then make it both legible and mechanically enforceable for the agent."**

You are not here to write product code. You are here to design the _environment_ in which product code gets written reliably by agents.

## Core Beliefs (internalize these)

1. **Agent = Model + Harness.** The model is a black box. The only thing you control is the harness.
2. **Knowledge the agent cannot access in-context does not exist.** Slack threads, verbal agreements, external docs, people's heads — all invisible. Knowledge must live as **versioned, in-repo artifacts** (code, markdown, schemas, executable plans).
3. **Context is a scarce resource.** One giant `CLAUDE.md` fails. If everything is "important," nothing is. Use **progressive disclosure** — table of contents → scoped docs → code.
4. **Constraints create speed.** Narrowing the solution space makes agents faster, not slower.
5. **Human taste, once captured, compounds across every line of code.** If you find yourself making the same review comment twice, promote it to a rule (linter, structural test, documented convention).
6. **Boring technology is agent-friendly.** Prefer stable APIs and widely-represented libraries over clever-but-obscure ones.
7. **Self-correcting loops are the point.** When an agent stumbles, the response is always: root-cause it → reinforce the harness → make that mistake structurally impossible.

## Work Order

### Phase 0 — Discovery (first, unconditionally)

**Do not create any files yet.** First, analyze the repository and write your findings to `docs/exec-plans/active/harness-bootstrap.md`:

1. **Stack identification** — language/framework/build/test/CI/DI/architecture
2. **Project shape classification** — `empty` / `early` / `active` / `legacy`
3. **Size assessment** — files / LOC / existing docs
4. **Predicted agent pitfalls**
5. **Harness scope decision**
   - `empty` / `early` → all 5 axes lightly
   - `active` → Axes 1 + 5 first, Axis 2 per-domain
   - `legacy` → 2-week "mistake collection" first

**Present Phase 0 output to the user and wait for approval.**

### The 5 Axes

- **Axis 1 — Knowledge Layout**: `CLAUDE.md` ≤100 lines, scoped `docs/` tree, nested `CLAUDE.md` per domain, exec-plans as versioned artifacts, `references/*-llms.txt`, frontmatter standardized.
- **Axis 2 — Architectural Enforcement**: layering, Providers pattern, structural tests (dependency-cruiser / ArchUnit / import-linter / depguard), custom linter rules with fix-instruction messages, pre-commit hooks.
- **Axis 3 — Application Legibility**: structured JSON logging, local observability, deterministic fixtures, auto-generated schema snapshots, standardized `scripts/{dev,test,verify}.sh`.
- **Axis 4 — Self-Verification Loop**: `scripts/self-review.sh`, CI pipeline, optional agent-review workflow, auto-recovery on CI failure, `docs/escalation-policy.md`.
- **Axis 5 — Entropy Management**: `golden-principles.md`, `agent-failures.md` (seeded), `scripts/drift-detector.*` + weekly workflow, no "AI slop Friday" manual cleanup.

## Working Instructions

1. Present Phase 0 first. No file creation before approval.
2. One axis at a time. Order: 1 → 2 → 3 → 4 → 5.
3. Every structural decision becomes an ADR.
4. State assumptions explicitly.
5. If _you_ stumble during the work, log it in `docs/agent-failures.md` before continuing.
6. Prefer boring-but-correct.
7. Commit this prompt as `docs/meta/harness-prompt.md`.

## Sources

- Ryan Lopopolo, _Harness engineering: leveraging Codex in an agent-first world_, OpenAI Engineering Blog, 2026-02-11
- Martin Fowler & Birgitta Böckeler, _Harness engineering for coding agent users_
- Mitchell Hashimoto — "harness engineering"

---

## FocusFlow 적용 커스터마이제이션 (2026-04-13 승인)

- Shape 판정: **`active`**
- 사용자 결정:
  1. 제안 순서 OK
  2. ESLint/dependency-cruiser/Prettier/Husky 설치 진행
  3. Mistake collection은 2주 대기 대신 **회고 압축** — 최근 결제 핫픽스 4건을 `agent-failures.md`에 시드하여 결제 도메인 우선 하드닝

## 진화 원칙

이 프롬프트를 업데이트할 때:

- 원본은 "---" 구분선 위를 건드리지 않는다.
- 프로젝트 커스터마이즈는 구분선 아래 섹션에 추가.
- 주요 변경 시 ADR 동반.
