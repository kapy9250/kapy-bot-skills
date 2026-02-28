---
name: watchlist-sop
description: Run watchlist-based Git hygiene and synchronization for multiple repositories. Use when user asks to "扫描监控目录", "处理不一致目录", "按SOP收敛", or wants structured status + cleanup/commit/push decisions.
---

# Watchlist Scan & Reconciliation SOP

## Fixed Inputs
- Watchlist file: `/workspace/workspaces/cody/config/repo_watchlist.json`
- Scanner script: `/workspace/workspaces/cody/config/git_watchlist_status.py`
- Report output: `/workspace/workspaces/cody/reports/git_watchlist_status.json`
- Monitoring scope policy:
  - Primary goal: monitor **agent system health files** (SOUL/AGENTS/USER/TOOLS, config, memory, skills) for long-term stable operation.
  - Secondary goal: monitor selected **focus projects** explicitly listed in watchlist.
- Exclusion policy:
  - Exclude `_archive` paths
  - Exclude directories whose basename starts with `polymarket`

## Step 1) Scan
- Run scanner and save structured JSON output.
- Read and report:
  - total / consistent / inconsistent
  - uncommitted / unpushed / behind / no_upstream
  - inconsistent repo list with status_class + reasons

## Step 2) Classify each inconsistent repo
Use these categories:
- `DIRTY_ONLY`: local uncommitted changes
- `AHEAD_UNPUSHED`: local commits not pushed
- `BEHIND_REMOTE`: remote commits not synced locally
- `NO_UPSTREAM` or branch mismatch
- gitlink/subrepo pointer drift

## Step 3) Apply SOP actions
### A) DIRTY_ONLY
- Inspect file-level changes with `git status --porcelain` and `git diff`.
- Apply root-level triage rules:
  - New **root directory**: ignore by default unless clearly OpenClaw agent assets (`memory/`, `skills/`, `config/`, `prompts/`, `templates/`, `references/`, `tasks/`).
  - New **root file**: classify source first; keep only agent/system files, ignore user-created or service-generated artifacts.
  - If source cannot be judged with high confidence: stop and report as `needs_user_decision`.
- Keep and commit only meaningful assets (docs/config/skill updates/memory under policy).
- Revert or ignore runtime noise (cache/temp/state files).
- If repeated noise appears, update `.gitignore` before commit.

### B) AHEAD_UNPUSHED
- Review commit list (`upstream..HEAD`).
- Push when commits are intentional and clean.

### C) BEHIND_REMOTE
- Fetch/pull (prefer rebase), resolve conflicts, then continue.

### D) NO_UPSTREAM / branch mismatch
- Set correct upstream (`branch --set-upstream-to`).
- Recalculate ahead/behind and continue.

### E) gitlink drift
- Default: revert parent gitlink drift unless user explicitly wants lockfile pointer upgrade.
- If removing a gitlink permanently, commit parent repo deletion and push.

## Step 4) Commit/Push discipline
- Commit repo-by-repo with clear messages.
- Push immediately after each successful commit.
- If push fails due to credentials, repair credential helper and retry once.

## Step 5) Mandatory reporting format
After operations, always return:
1. Summary metrics (before/after)
2. Per-repo action result
3. **Changed file list per commit** (A/M/D paths)
4. For each root-level new file/dir: classification result (`agent_asset` / `runtime_noise` / `needs_user_decision`)
5. Remaining inconsistent repos (if any)

## Output rules
- Be concise and operational.
- Do not expose secrets/tokens.
- For sensitive files (`.env*`, tokens, webhooks), never print full values.
