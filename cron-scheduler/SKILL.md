---
name: cron-scheduler
description: Add, modify, verify, and troubleshoot scheduled tasks for this workspace. Use when user asks to set up 定时任务/cron jobs, hourly/daily automation, host crontab changes, or deployment/host-crontab updates. Prefer repository-managed schedule flow: edit /workspace/deployment/host-crontab first, then verify sync/apply behavior.
---

# Cron Scheduler

## Default workflow
1. Classify target environment:
   - Prefer repo-managed cron file: `/workspace/deployment/host-crontab`.
   - Only use direct `crontab` commands when user explicitly requests and environment supports it.
2. Discover existing schedule pattern before editing:
   - Reuse existing `docker exec $CONTAINER ...` style.
   - Match logging path conventions under `/var/log/openclaw/` (or existing file-specific paths).
3. Apply minimal change:
   - Add/update one clearly named cron entry with comment.
   - Avoid touching unrelated jobs.
4. Verify:
   - Confirm new line exists with `grep -n`.
   - Validate cron format: minute hour day month weekday user command.
   - Confirm command is absolute-path based.
5. Report back:
   - Exact schedule expression.
   - Target script/command.
   - Expected next run time (UTC, approximate).
   - Quick rollback instruction.

## Required checks for this repo
- Check `deployment/README.md` for sync mechanism.
- If `host-crontab` is auto-synced to `/etc/cron.d/...`, prefer editing file only (no duplicate host-side manual edits).
- Keep `SHELL`, `PATH`, `CONTAINER` header untouched unless requested.

## Safe patterns
- For env loading inside container, use:
  - `docker exec $CONTAINER bash -lc 'set -a; source /workspace/.env; set +a; <cmd>'`
- Redirect output to log files for observability.

## Rollback patterns
- Remove the added line by unique marker comment.
- Re-verify with `grep` that marker is gone.

## Done criteria
- Cron entry present in `deployment/host-crontab`.
- Command path and env strategy are explicit.
- User gets copy-paste verification command(s).
