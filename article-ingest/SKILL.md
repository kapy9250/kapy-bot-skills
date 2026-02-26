---
name: article-ingest
description: Download long-form web/X/PDF articles into local knowledge folders with clean Markdown, local image assets, high-quality Chinese translation, and GitHub submission. Use when user asks to "下载文章", "保存到目录", "转 Markdown", "翻译", or "提交到 GitHub".
---

# Article Ingest Workflow

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

## 6) Pre-submit validation
- Verify filenames and slug consistency.
- Verify all markdown image links resolve to local relative files.
- Verify noisy wrapper text has been removed.
- Verify Chinese file exists for non-Chinese source.

## 7) GitHub submission (default final step)
- Always submit at the end (unless user explicitly says不要提交).
- In target directory repo:
  - `git add <en> <zh> assets/<slug>`
  - `git commit -m "docs: add <slug> article (EN/ZH) with local images"`
  - `git push`
- Return GitHub paths in reply:
  - English markdown blob URL
  - Chinese markdown blob URL
  - Assets directory tree URL

## 8) Cleanup
- Delete temp files and intermediate artifacts.
- Keep only cleaned EN/ZH + final assets unless user asks otherwise.

## 9) Reply format
- Return concise completion summary:
  - saved files
  - asset count
  - commit hash / repo link (if pushed)
