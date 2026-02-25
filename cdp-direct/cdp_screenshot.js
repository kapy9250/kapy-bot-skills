#!/usr/bin/env node
/**
 * CDP Screenshot Tool
 * Usage: node cdp_screenshot.js <url-keyword> [-o output.png]
 */

const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');

const CDP_HOST = process.env.CDP_HOST || '172.30.0.1';
const CDP_PORT = process.env.CDP_PORT || '9222';
const OUTPUT_DIR = '/tmp/browser_screenshots';

function getPageId(urlPattern) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: CDP_HOST,
      port: parseInt(CDP_PORT),
      path: '/json',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const pages = JSON.parse(data);
          for (const page of pages) {
            if (!urlPattern || page.url.includes(urlPattern)) {
              resolve(page.webSocketDebuggerUrl);
              return;
            }
          }
          // Return first page if no match
          if (pages.length > 0) {
            resolve(pages[0].webSocketDebuggerUrl);
          } else {
            resolve(null);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

async function main() {
  const args = process.argv.slice(2);
  let urlPattern = null;
  let outputPath = `${OUTPUT_DIR}/screenshot.png`;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-o' && args[i + 1]) {
      outputPath = args[i + 1];
      i++;
    } else if (!args[i].startsWith('-')) {
      urlPattern = args[i];
    }
  }

  if (!urlPattern) {
    console.log('Usage: node cdp_screenshot.js <url-keyword> [-o output.png]');
    console.log('Example: node cdp_screenshot.js coinglass -o screenshot.png');
    process.exit(1);
  }

  try {
    const wsUrl = await getPageId(urlPattern);
    if (!wsUrl) {
      console.error('No page found');
      process.exit(1);
    }

    console.log('Connecting to:', wsUrl);

    const ws = new WebSocket(wsUrl, { maxPayload: 10 * 1024 * 1024 });

    ws.on('open', () => {
      // Get page title
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: { expression: 'document.title' }
      }));
    });

    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());

      if (msg.id === 1 && msg.result && msg.result.result) {
        console.log('Page title:', msg.result.result.value);
      }

      if (msg.id === 2 && msg.result && msg.result.data) {
        const imgData = msg.result.data;
        const buffer = Buffer.from(imgData, 'base64');

        // Ensure directory exists
        const dir = outputPath.substring(0, outputPath.lastIndexOf('/'));
        if (dir && !fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(outputPath, buffer);
        const size = fs.statSync(outputPath).size;
        console.log(`Screenshot saved: ${outputPath} (${(size / 1024 / 1024).toFixed(2)}MB)`);
        ws.close();
        process.exit(0);
      }
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err.message);
      process.exit(1);
    });

    // Wait for page to load, then take screenshot
    setTimeout(() => {
      ws.send(JSON.stringify({
        id: 2,
        method: 'Page.captureScreenshot',
        params: { format: 'png', captureBeyondViewport: true }
      }));
    }, 3000);

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
