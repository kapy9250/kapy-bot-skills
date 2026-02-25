#!/usr/bin/env node
/**
 * 整点市场报告
 * 包含: 最近2小时RSS新闻 + 价格快照 + 恐惧贪婪 + 关键技术指标
 */

const { execSync } = require('child_process');
const https = require('https');
const fs = require('fs');
const path = require('path');

// 加载配置
function loadConfig() {
  const config = {};
  const envPath = path.join(__dirname, '../../../.shared/.env.push');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^([A-Z_]+)=(.+)$/);
      if (match) config[match[1]] = match[2].trim();
    });
  }
  if (process.env.COINGECKO_API_KEY) config.COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
  return config;
}

const CONFIG = loadConfig();
const COINGECKO_KEY = CONFIG.COINGECKO_API_KEY || process.env.COINGECKO_API_KEY;

// Fetch helper
function fetch(url, headers = {}) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        }).on('error', reject);
    });
}

// Format helpers
function formatNum(n, decimals = 0) {
    if (n === null || n === undefined) return 'N/A';
    return n.toLocaleString('en-US', { 
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals 
    });
}

function formatPct(n) {
    if (n === null || n === undefined) return 'N/A';
    const sign = n >= 0 ? '+' : '';
    return `${sign}${n.toFixed(2)}%`;
}

function changeEmoji(n) {
    if (n > 0) return '🟢';
    if (n < 0) return '🔴';
    return '⚪';
}

async function main() {
    const now = new Date();
    const timeStr = now.toISOString().split('T')[1].slice(0, 5);
    
    const report = [];
    report.push(`📊 **整点市场快照** ${timeStr} UTC\n`);
    report.push(`━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    
    try {
        // 1. 获取RSS新闻（最近2小时）
        console.error('Fetching RSS news...');
        let newsLines = [];
        try {
            const newsJson = execSync(
                'node /workspace/projects/rss-news/scripts/get_recent_news.js --hours 2',
                { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
            );
            const news = JSON.parse(newsJson);
            if (news.length > 0) {
                newsLines = news;
            }
        } catch (e) {
            console.error('RSS fetch failed:', e.message);
        }
        
        if (newsLines.length > 0) {
            report.push(`📰 **最近两小时**\n`);
            newsLines.forEach(line => report.push(line));
            report.push('');
        } else {
            report.push(`📰 **最近两小时**\n`);
            report.push(`ℹ️ 暂无新闻更新\n`);
        }
        
        report.push(`━━━━━━━━━━━━━━━━━━━━━━━━\n`);
        
        // 2. 获取价格数据
        console.error('Fetching prices...');
        const prices = await fetch(
            'https://pro-api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true',
            { 'x-cg-pro-api-key': COINGECKO_KEY }
        );
        
        report.push(`💰 **价格**`);
        report.push(`• BTC: $${formatNum(prices.bitcoin.usd)} (${changeEmoji(prices.bitcoin.usd_24h_change)} ${formatPct(prices.bitcoin.usd_24h_change)})`);
        report.push(`• ETH: $${formatNum(prices.ethereum.usd)} (${changeEmoji(prices.ethereum.usd_24h_change)} ${formatPct(prices.ethereum.usd_24h_change)})\n`);
        
        report.push(`━━━━━━━━━━━━━━━━━━━━━━━━\n`);
        
        // 3. 恐惧贪婪指数
        console.error('Fetching Fear & Greed...');
        const fng = await fetch('https://api.alternative.me/fng/?limit=1');
        const fngValue = parseInt(fng.data[0].value);
        const fngClass = fng.data[0].value_classification;
        const fngEmoji = fngValue <= 25 ? '😱' : fngValue <= 45 ? '😨' : fngValue <= 55 ? '😐' : fngValue <= 75 ? '😊' : '🤑';
        
        report.push(`😱 **情绪**`);
        report.push(`恐惧贪婪: ${fngValue} (${fngClass}) ${fngEmoji}\n`);
        
        report.push(`━━━━━━━━━━━━━━━━━━━━━━━━\n`);
        
        // 4. 简化技术指标（使用缓存）
        console.error('Fetching cached technical indicators...');
        const CACHE_FILE = '/workspace/market-data/cache/btc-technicals.json';
        let technicals = null;
        
        try {
            const fs = require('fs');
            const cacheData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
            const cacheAge = Date.now() - cacheData.timestamp;
            
            // 缓存有效期：4小时
            if (cacheAge < 4 * 60 * 60 * 1000) {
                technicals = cacheData;
            }
        } catch (e) {
            // 缓存不存在或过期，需要重新计算
        }
        
        if (!technicals) {
            // 获取历史数据计算技术指标
            console.error('Cache miss, fetching historical data...');
            const history = await fetch(
                'https://pro-api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=200&interval=daily',
                { 'x-cg-pro-api-key': COINGECKO_KEY }
            );
            
            const btcPrices = history.prices.map(p => p[1]);
            const btcCurrent = btcPrices[btcPrices.length - 1];
            const btcMA200 = btcPrices.slice(-200).reduce((a, b) => a + b) / 200;
            
            // 计算RSI
            let gains = 0, losses = 0;
            for (let i = btcPrices.length - 14; i < btcPrices.length; i++) {
                const diff = btcPrices[i] - btcPrices[i - 1];
                if (diff > 0) gains += diff;
                else losses -= diff;
            }
            const avgGain = gains / 14;
            const avgLoss = losses / 14;
            const rsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
            
            technicals = {
                rsi: rsi,
                ma200: btcMA200,
                current: btcCurrent,
                distMA200: ((btcCurrent - btcMA200) / btcMA200 * 100),
                timestamp: Date.now()
            };
            
            // 保存缓存
            const fs = require('fs');
            const cacheDir = '/workspace/market-data/cache';
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
            }
            fs.writeFileSync(CACHE_FILE, JSON.stringify(technicals));
        }
        
        report.push(`📈 **技术**`);
        report.push(`• RSI(14): ${technicals.rsi.toFixed(1)} (${technicals.rsi > 70 ? '🔴 超买' : technicals.rsi < 30 ? '🟢 超卖' : '⚪ 中性'})`);
        report.push(`• 距MA200: ${formatPct(technicals.distMA200)} (${technicals.distMA200 > 0 ? '🐂 牛市' : '🐻 熊市'})`);
        
    } catch (err) {
        report.push(`\n⚠️ 部分数据获取失败: ${err.message}`);
    }
    
    // 输出
    console.log(report.join('\n'));
}

main().catch(console.error);
