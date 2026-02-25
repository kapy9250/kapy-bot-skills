# Skill: Polymarket Value Evaluation (Over/Underpriced Side)

## Purpose
Help the user evaluate whether a prediction market position (YES/NO) is **overpriced** or **underpriced** by comparing:
- **Market implied probability** (from price)
- **User’s estimated true probability** (from evidence + rules)

Output a clear recommendation and risk notes, not trading advice disclaimers.

## When to Use
Use when the user asks about:
- Finding mispriced Polymarket markets
- Determining if a side is under/overvalued
- Building a repeatable process for prediction market “edge”

## Key Definitions
- **YES price** `p` ≈ implied probability `p` (0–1). (Assume USDC-style pricing.)
- **True probability** `q` = your estimate given information.
- **Edge** `edge = q - p` (positive means YES underpriced; negative means YES overpriced).
- For NO, implied probability is `1-p` and edge is `(1-q) - (1-p) = p - q`.

## Required Inputs (ask if missing)
1. Market title + full resolution criteria / rules (exact wording).
2. Current YES/NO prices (or best bid/ask).
3. Deadline / resolution date.
4. User horizon: quick trade vs hold to resolution.
5. User constraints: max position size or “can’t exit thin markets”.

## Process
### Step 1 — Rule/Settlement Audit (highest priority)
Identify the **resolution source**, **time window**, and **exact condition**.
- Clarify ambiguous terms: “announced”, “official”, “final”, “effective”, “by date”, “at any time”.
- Identify revision risk (prelim vs final data).
- If rules are unclear or depend on subjective interpretation, add settlement-risk penalty to edge threshold.

### Step 2 — Convert Market to Probabilities
- Use mid-price if available; otherwise note spread and use conservative side (worse price).
- Record `p_yes` and `p_no = 1 - p_yes`.

### Step 3 — Build Your Probability `q`
Use a lightweight Bayesian-ish approach:
1. **Prior**: baseline frequency / historical rate / structural base rate.
2. **Evidence update**: credible information sources with weights.
3. **Time update**: as resolution approaches, paths that require multiple future steps lose probability.

Output `q` as a point estimate and a range (e.g., 0.52 with [0.45, 0.60]).

### Step 4 — Cross-Market Consistency Checks
Look for probability logic violations:
- Nested events: `P(A and B) ≤ P(A)`
- Mutually exclusive outcomes: sum ≈ 1 (adjust for “none” outcome when relevant)
- “Stricter condition” should not be more likely than “looser condition”.

If inconsistencies exist, mark as an “arb watch” or “mispricing candidate”.

### Step 5 — Liquidity/Execution Reality Check
Edge must clear practical frictions:
- Spread, slippage, fees
- Ability to exit vs expected hold-to-resolution
- Thin books = require larger edge buffer

### Step 6 — Decision Threshold
Provide a thresholded conclusion:
- **Underpriced YES** if `q - p ≥ buffer`
- **Overpriced YES** if `p - q ≥ buffer` (equivalently underpriced NO)

Suggested buffers (tune by context):
- Very liquid + clear rules: 2–4%
- Normal: 5–8%
- Thin/ambiguous/high settlement risk: 10%+

### Step 7 — Output Format (concise)
Return:
1. **Summary**: Underpriced/Overpriced/No clear edge
2. **Numbers**: `p`, `q`, edge, and buffer used
3. **Key evidence**: 3–6 bullets
4. **Main risks**: settlement ambiguity, timing, data revisions, correlated risks
5. **What would change your mind**: specific triggers

## Quick 2-Minute Checklist (for rapid screening)
- Can I state the resolution condition in one sentence?
- Do I know the resolution source and time window?
- What’s my base rate prior?
- Do related markets imply inconsistent probabilities?
- Is liquidity sufficient for my intended size/horizon?
- Does edge exceed buffer after costs/uncertainty?

## Notes / Guardrails
- Avoid claiming certainty; always express `q` with a range.
- If rules are unclear, recommend “skip unless edge is huge”.
- Prefer markets where information is likely to become public by a known time (edge realization).
