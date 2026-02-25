#!/usr/bin/env node
/**
 * CDP Get HTML Tool
 * Usage: node cdp_get_html.js <url-keyword> [-o output.html]
 */

const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');

const CDP_HOST = process.env.CDP_HOST || '172.30.0.1';
const CDP_PORT = process.env.CDP_PORT || '9222';

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
          let target = null;
          
          // 优先查找 type=page 且 url 匹配的目标
          for (const page of pages) {
            if (page.type === 'page' && (!urlPattern || page.url.includes(urlPattern))) {
              target = page;
              break;
            }
          }
          
          if (target) {
            console.log(`Target found: [${target.type}] ${target.title} (${target.url})`);
            resolve(target.webSocketDebuggerUrl);
          } else {
            // 如果没找到 page，再找其他类型 (fallback)
            for (const page of pages) {
              if (!urlPattern || page.url.includes(urlPattern)) {
                console.log(`Target found (non-page): [${page.type}] ${page.title} (${page.url})`);
                resolve(page.webSocketDebuggerUrl);
                return;
              }
            }
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
  let outputPath = '/tmp/page_content.html';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-o' && args[i + 1]) {
      outputPath = args[i + 1];
      i++;
    } else if (!args[i].startsWith('-')) {
      urlPattern = args[i];
    }
  }

  if (!urlPattern) {
    console.log('Usage: node cdp_get_html.js <url-keyword> [-o output.html]');
    console.log('Example: node cdp_get_html.js coinglass -o page.html');
    process.exit(1);
  }

  try {
    const wsUrl = await getPageId(urlPattern);
    if (!wsUrl) {
      console.error('No page found');
      process.exit(1);
    }

    console.log('Connecting to:', wsUrl);

    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
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

      if (msg.id === 2 && msg.result && msg.result.result) {
        const html = msg.result.result.value;
        fs.writeFileSync(outputPath, html);
        console.log(`HTML saved: ${outputPath} (${html.length} chars)`);
        ws.close();
        process.exit(0);
      }
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err.message);
      process.exit(1);
    });

    setTimeout(() => {
      ws.send(JSON.stringify({
        id: 2,
        method: 'Runtime.evaluate',
        params: { expression: 'document.documentElement.outerHTML' }
      }));
    }, 2000);

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
