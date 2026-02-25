---
name: cdp-direct
description: Advanced browser control via Chrome DevTools Protocol (CDP). Use for taking reliable screenshots and extracting full HTML content when the standard browser tool fails. Accesses the browser directly on 172.30.0.1:9222.
---

# CDP Direct Browser Control Skill

Use this skill when you need to directly access the browser service via CDP (Chrome DevTools Protocol) without relying on the `browser` tool. This is useful for robust screenshots and HTML extraction, especially when the main tool is unreliable or needs fine-grained control.

**Location:** `/workspace/skills/cdp-direct`

## Usage

You can call the scripts directly using `exec`.

### 1. Screenshot
Takes a full-page screenshot of the *first* matching tab.

```bash
# Capture screenshot of a tab containing "coinglass" in the URL
node /workspace/skills/cdp-direct/cdp_screenshot.js coinglass -o /workspace/screenshots/coinglass.png
```

- `url-keyword`: Substring to match in the URL (e.g., "coinglass", "google"). If omitted or empty, matches the first tab.
- `-o <path>`: Output path for the PNG file. Default: `/tmp/screenshot.png`.

### 2. Get HTML
Extracts the full HTML content of the *first* matching tab.

```bash
# Get HTML of a tab containing "coinglass"
node /workspace/skills/cdp-direct/cdp_get_html.js coinglass -o /workspace/data/coinglass.html
```

- `url-keyword`: Substring to match in the URL.
- `-o <path>`: Output path for the HTML file. Default: `/tmp/page_content.html`.

## Environment Variables (Optional)

- `CDP_HOST`: IP address of the browser service (default: `172.30.0.1`)
- `CDP_PORT`: Port (default: `9222`)

## Example Workflow

1. Open a page using `browser open`.
2. Use this skill to take a screenshot or get HTML if `browser screenshot` fails or returns empty data.

```javascript
// Example in Node.js script
const { execSync } = require('child_process');
execSync('node /workspace/skills/cdp-direct/cdp_screenshot.js "example.com" -o output.png');
```
