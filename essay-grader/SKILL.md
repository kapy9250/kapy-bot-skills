---
name: essay-grader
description: Professional essay grading skill for North American high school Language Arts standards. Use when asked to grade, evaluate, critique, review, or provide feedback on student essays, papers, or written assignments. Provides structured assessment across multiple dimensions including content depth, organization, language style, conventions, and advanced skills like intellectual risk-taking and original insights. Supports both 50-point detailed rubric and Alberta Education 10-point scale for Personal Response to Texts.
---

# Essay Grader

Grade student essays using North American top high school LA standards. Provide structured, actionable feedback.

## Supported Essay Types

| Type | Description | Primary Rubric |
|------|-------------|----------------|
| **Argumentative** | Takes a position, argues with evidence | 50-point (5 dimensions) |
| **Analytical** | Literary/text analysis | 50-point (5 dimensions) |
| **Personal Response** | Response to prompting text (Alberta) | Alberta 10-point + 50-point reference |
| **Expository** | Explains/informs | 50-point (5 dimensions) |
| **Narrative** | Tells a story | 50-point (adjusted for creative elements) |

## Grading Workflow

1. **Read the essay completely** before making any assessments
2. **Identify the essay type** — if Personal Response, use Alberta rubric as primary
3. **Note word count** — adjust error tolerance accordingly
4. **Evaluate each dimension** using appropriate rubric
5. **Generate dual scores** if Personal Response (Alberta + 50-point reference)
6. **Generate the grading report** following the output template

## Output Template: Standard Essays

```
# Essay Grading Report

## Overview
- Essay type: [type]
- Word count: [count]
- Overall grade: [A/B/C/D/F with +/-]
- Overall assessment: [2-3 sentence summary]

## Dimension Scores

### 1. Content & Ideas [Score: X/10]
**Scoring Rationale:**
- [Why this score — cite specific evidence from essay]

**Gap to Full Marks (10/10):**
- [What's missing or weak compared to a perfect score — be specific]

### 2. Organization & Structure [Score: X/10]
**Scoring Rationale:**
- [Why this score — cite specific evidence]

**Gap to Full Marks (10/10):**
- [What's missing or weak compared to a perfect score]

### 3. Language & Style [Score: X/10]
**Scoring Rationale:**
- [Why this score — cite specific evidence]

**Gap to Full Marks (10/10):**
- [What's missing or weak compared to a perfect score]

### 4. Conventions [Score: X/10]
**Scoring Rationale:**
- [Why this score — cite specific evidence]

**Gap to Full Marks (10/10):**
- [What's missing or weak compared to a perfect score]

### 5. Advanced Skills [Score: X/10]
**Scoring Rationale:**
- [Why this score — cite specific evidence]

**Gap to Full Marks (10/10):**
- [What's missing or weak compared to a perfect score]

## Summary
| Dimension | Score | Gap to 10 |
|-----------|-------|-----------|
| Content & Ideas | X/10 | [brief gap description] |
| Organization | X/10 | [brief gap description] |
| Language & Style | X/10 | [brief gap description] |
| Conventions | X/10 | [brief gap description] |
| Advanced Skills | X/10 | [brief gap description] |
| **Total** | **XX/50** | |

## Key Weaknesses (Priority Order)
1. [Most significant issue — what's wrong, not how to fix]
2. [Second issue]
3. [Third issue]

## Strengths
[What the essay does well]
```

**Important:** 
- Do NOT provide specific revision suggestions, rewritten sentences, or example improvements
- Students must figure out HOW to improve on their own
- Only identify WHAT the problems are and WHY points were deducted
- "Gap to Full Marks" explains what a 10/10 requires that this essay lacks

## Output Template: Personal Response (Alberta)

For Personal Response essays, provide **dual scoring**:

```
# Personal Response Grading Report

## Overview
- Assignment: Personal Response to Text
- Prompting text: [title/description]
- Word count: [count]
- **Alberta Score: X/10** (Ideas: X/5 + Presentation: X/5)
- **50-Point Reference: XX/50** (for detailed diagnostics)
- Overall assessment: [2-3 sentences]

## Alberta Scoring

### Ideas and Impressions [X/5]
**Level achieved:** [Excellent/Proficient/Satisfactory/Limited/Poor]

**Scoring Rationale:**
- Exploration of topic: [assessment with evidence]
- Ideas and perceptions: [quality assessment]
- Support: [how well evidence reinforces ideas]

**Gap to Full Marks (5/5):**
- [What's missing compared to Excellent level — be specific]

### Presentation [X/5]
**Level achieved:** [Excellent/Proficient/Satisfactory/Limited/Poor]

**Scoring Rationale:**
- Voice: [distinctiveness assessment]
- Stylistic choices: [quality assessment]
- Tone: [consistency assessment]
- Unifying/Aesthetic effect: [coherence assessment]

**Gap to Full Marks (5/5):**
- [What's missing compared to Excellent level — be specific]

## 50-Point Reference Breakdown

| Dimension | Score | Gap to 10 |
|-----------|-------|-----------|
| Content & Ideas | X/10 | [what's missing for full marks] |
| Organization | X/10 | [what's missing for full marks] |
| Language & Style | X/10 | [what's missing for full marks] |
| Conventions | X/10 | [what's missing for full marks] |
| Advanced Skills | X/10 | [what's missing for full marks] |
| **Total** | **XX/50** | |

## Error Tolerance Note
Word count: [X] | Complexity: [Low/Medium/High]
→ Error tolerance applied: [assessment]

## Key Weaknesses (Priority Order)
1. [Most significant — what's wrong]
2. [Second issue]
3. [Third issue]

## Strengths
[What the response does well]
```

**Important:** Do NOT provide revision suggestions or rewritten examples. Identify problems only — students must develop their own solutions.

## Scoring Systems

### 50-Point Scale (5 Dimensions × 10 points)

| Score | Level | Description |
|-------|-------|-------------|
| 9-10 | Exceptional | Publishable quality |
| 7-8 | Strong | Honors/AP standard |
| 5-6 | Adequate | Meets requirements |
| 3-4 | Below | Significant issues |
| 1-2 | Poor | Does not meet standards |

### Alberta 10-Point Scale (2 Dimensions × 5 points)

| Score | Level |
|-------|-------|
| 5 | Excellent |
| 4 | Proficient |
| 3 | Satisfactory |
| 2 | Limited |
| 1 | Poor |
| 0 | Insufficient |

### Cross-Reference Conversion

| Alberta (10) | 50-Point | Letter |
|--------------|----------|--------|
| 9-10 | 45-50 | A |
| 8 | 40-44 | B+ |
| 7 | 37-39 | B/B- |
| 6 | 33-36 | C+ |
| 5 | 30-32 | C |
| 4 | 25-29 | C-/D+ |
| 3 | 20-24 | D |
| 0-2 | Below 20 | F |

## Error Tolerance Guidelines

Per Alberta standards, consider error proportion relative to length/complexity:

| Word Count | Complexity | Tolerance |
|------------|------------|-----------|
| <500 | Simple | Low — few errors significant |
| 500-800 | Medium | Medium — allow minor errors |
| >800 | Complex | High — focus on patterns, not isolated errors |

## Feedback Principles

1. **Be specific**: Quote the essay directly when identifying issues
2. **Be diagnostic**: Explain WHY something is a problem, not HOW to fix it
3. **Be balanced**: Acknowledge strengths even in weak essays
4. **Prioritize**: Identify 2-3 key weaknesses, not overwhelming lists
5. **Respect the genre**: Personal Response allows subjectivity; don't penalize "I"
6. **NO revision suggestions**: Never provide rewritten sentences, example fixes, or specific improvement instructions — students must develop solutions independently

## Reference Files

- `references/rubric.md` — Detailed 50-point rubric (5 dimensions)
- `references/alberta-rubric.md` — Alberta Personal Response criteria with examples
- `references/examples.md` — Calibration samples at each grade level
