---
name: bugfix
description: Fix software bugs from error messages, logs, failing tests, or explicit "fix bug" requests. Use when the user provides stack traces, test failures, runtime errors, or asks to diagnose and repair incorrect behavior with minimal safe changes and verification.
---

# Skill: BUGFIX

## Input
- Collect error message.
- Collect logs (if any).
- Collect steps to reproduce (if any).
- Collect expected behavior.

## Process
1. Reproduce the failure, or infer the most likely failure path when reproduction is not immediately possible.
2. Identify root cause precisely (file/module/line and faulty assumption).
3. Implement the smallest correct fix.
4. Add a regression guard (test/check/assertion) when feasible.
5. Verify the fix (run tests, show logs, or provide equivalent proof).
6. Summarize clearly:
   - Root cause
   - Fix
   - Proof
   - Prevention rule
7. If a reusable pattern is discovered, append to `tasks/lessons.md` using:
   - Pattern
   - Cause
   - Prevention
   - Example

## Execution Rules
- Prefer narrow, reversible edits.
- Do not widen scope beyond the reported bug unless required for correctness.
- If blocked by missing context, state exactly what is missing and propose the next best diagnostic step.
- If no reliable fix can be confirmed, report uncertainty explicitly instead of guessing.
