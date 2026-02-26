---
name: article-ingest
description: Download long-form web/X/PDF articles into local knowledge folders with clean Markdown, local image assets, high-quality Chinese translation, and GitHub submission. Auto-trigger when user says "下载文章" or "下载文章并保存"; default to full pipeline (download + clean + Chinese translation for non-Chinese + push).
---

# Article Ingest Workflow

## Repo Binding (fixed target)
- This skill is bound to ONE repo only: `https://github.com/kapy9250/external-brain.git`
- Local working repo path: `/workspace/external brain`
- When user says "下载文章" or "下载文章并保存", run full pipeline automatically in this repo.
- Do NOT push to `/workspace` parent repo for this skill.
- If push fails due to auth/network, report failure and keep local files in `/workspace/external brain`.

## 1) Fetch
- Prefer readable mirror first: `https://r.jina.ai/http://<original-url>`.
- If source is X/Twitter status, use the mirrored URL to extract article body markdown.

## 2) Clean Markdown (body-only)
- Remove wrapper noise (title/source boilerplate, conversation headers, nav text).
- Keep正文段落顺序不变。
- Output: `<slug>.cleaned.md`.

## 2.1) PDF handling (when source is PDF)
- Extract text by page order first, keep stable heading structure.
- If embedded images exist, extract to `assets/<slug>/` and keep relative links.
- Keep a quick conversion if OCR is unavailable; mark quality limits clearly if text layer is poor.

## 3) Localize images
- Find markdown image links from `pbs.twimg.com/media/...`.
- Download into: `assets/<slug>/image-01.jpg` etc.
- Rewrite markdown image links to relative paths:
  - `./assets/<slug>/image-XX.ext`
- Keep original click-through target URL unchanged.

## 4) Chinese translation (default: high-quality)
- If source is non-Chinese, always generate Chinese counterpart:
  - `<slug>.cleaned.zh.md`
- Translation standard (default, required):
  - Faithful to original meaning (no factual drift)
  - Professionally polished for natural Chinese readability
  - Keep technical/proper nouns in original form when appropriate (e.g., product names, protocol names, API names, model names, class/function names)
  - Keep numbers, units, versions, commands, and code tokens unchanged
- Preserve:
  - Markdown structure
  - Image/link URLs
  - Code blocks / YAML / commands
- Translate prose only.

## 5) Directory/file convention
- English: `<slug>.cleaned.md`
- Chinese: `<slug>.cleaned.zh.md`
- Assets: `assets/<slug>/`

## 5.1) Ordered numeric prefix rule (required)
- For article markdown files, prepend an incremental numeric prefix by add order:
  - `N_<slug>.cleaned.md`
  - `N_<slug>.cleaned.zh.md`
- `N` starts from 1 and increases by 1 using existing numbered articles in the target repo.
- Keep EN/ZH pair under the same `N`.
- If the article already exists (same slug), keep existing `N` and update in place (no new number).
- Apply numbering to article markdown files only; do not rename assets folder structure unless user explicitly requests it.

## 6) Pre-submit validation
- Verify filenames and slug consistency.
- Verify ordered numeric prefix (`N_`) is present and correct for EN/ZH pair.
- Verify all markdown image links resolve to local relative files.
- Verify noisy wrapper text has been removed.
- Verify Chinese file exists for non-Chinese source.

## 7) GitHub submission (default final step)
- Always submit at the end by default, including when user only says "下载文章" or "下载文章并保存".
- Skip push only when user explicitly says不要提交/不推送.
- Use the fixed repo at `/workspace/external brain` (`kapy9250/external-brain`).
- In target repo:
  - `git add <en> <zh> assets/<slug>`
  - `git commit -m "docs: add <slug> article (EN/ZH) with local images"`
  - `git push origin main`
- Return GitHub paths in reply:
  - English markdown blob URL
  - Chinese markdown blob URL
  - Assets directory tree URL
  - commit hash

## 8) Cleanup
- Delete temp files and intermediate artifacts.
- Keep only cleaned EN/ZH + final assets unless user asks otherwise.

## 9) Reply format
- Return concise completion summary:
  - saved files
  - asset count
  - commit hash / repo link (if pushed)
