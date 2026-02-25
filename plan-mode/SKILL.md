---
name: plan-mode
description: Produce structured execution plans for non-trivial or medium/high-risk tasks, or whenever the user asks for a plan. Use when work needs clear scope control, assumptions, risk rating, verification steps, rollback strategy, and explicit completion criteria.
---

# Skill: PLAN_MODE

## Trigger
- Task is NON_TRIVIAL.
- Risk is MEDIUM or HIGH.
- User explicitly asks for a plan.

## Output Format
Always use exactly these sections and labels:

Goal:
Scope (in/out):
Assumptions:
Risk (Low/Med/High):
Plan:
- [ ] step 1
- [ ] step 2
Verification:
Rollback:
Risks (top 3):
Completion criteria:

## Rules
- Keep steps ordered, concrete, and testable.
- Keep scope boundaries explicit (what is in, what is out).
- Set risk level conservatively based on impact + uncertainty.
- Include at least one verification method.
- Include a realistic rollback path for reversible execution.
- Ensure completion criteria are observable and unambiguous.
