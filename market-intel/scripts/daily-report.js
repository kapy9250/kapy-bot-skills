#!/usr/bin/env node
/**
 * Daily Market Report Generator
 * 每日市场简报生成器
 * 
 * 数据源:
 * - CoinGecko Pro API: 价格、历史数据
 * - CoinMarketCap API: 全球指标、Top币种
 * - Mempool.space API: BTC算力、难度
 * - Alternative.me API: 恐惧贪婪指数
 * - Alpha Vantage API: 股票、黄金、债券
 * - Browser: Farside ETF、Whale Alert、CryptoQuant
 */

const https = require('https');
const http = require('http');
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
  // 环境变量优先
  Object.keys(process.env).forEach(key => {
    if (key.endsWith('_API_KEY') || key.endsWith('_KEY')) {
      config[key] = process.env[key];
    }
  });
  return config;
}

const CONFIG = loadConfig();
const COINGECKO_KEY = CONFIG.COINGECKO_API_KEY || process.env.COINGECKO_API_KEY;
const CMC_KEY = CONFIG.CMC_API_KEY || process.env.CMC_API_KEY;
const ALPHA_VANTAGE_KEY = CONFIG.ALPHA_VANTAGE_API_KEY || process.env.ALPHA_VANTAGE_API_KEY;

// Fetch helper
function fetch(url, headers = {}) {
    return new Promise((resolve, reject) => {
        const isHttps = url.startsWith('https');
        const client = isHttps ? https : http;
        
        const options = { headers };
        
        client.get(url, options, (res) => {
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

// Sleep helper
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Format number with commas
function formatNum(n, decimals = 2) {
    if (n === null || n === undefined) return 'N/A';
    return n.toLocaleString('en-US', { 
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals 
    });
}

// Format percentage
function formatPct(n) {
    if (n === null || n === undefined) return 'N/A';
    const sign = n >= 0 ? '+' : '';
    return `${sign}${n.toFixed(2)}%`;
}

// Get emoji for change
function changeEmoji(n) {
    if (n > 0) return '🟢';
    if (n < 0) return '🔴';
    return '⚪';
}

// Calculate RSI
function calcRSI(prices, period = 14) {
    if (prices.length < period + 1) return null;
    let gains = 0, losses = 0;
    for (let i = prices.length - period; i < prices.length; i++) {
        const diff = prices[i] - prices[i - 1];
        if (diff > 0) gains += diff;
        else losses -= diff;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) return 100;
    return 100 - (100 / (1 + avgGain / avgLoss));
}

// Calculate SMA
function calcSMA(prices, period) {
    if (prices.length < period) return null;
    const slice = prices.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
}

async function main() {
    const report = [];
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toISOString().split('T')[1].split('.')[0];
    
    report.push(`# 📊 市场日报 ${dateStr}`);
    report.push(`> 生成时间: ${timeStr} UTC\n`);
    
    try {
        // 0. 获取RSS新闻（最近24小时）
        console.log('Fetching RSS news (24h)...');
        let newsLines = [];
        try {
            const { execSync } = require('child_process');
            const newsJson = execSync(
                'node /workspace/projects/rss-news/scripts/get_recent_news.js --hours 24',
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
            report.push(`## 📰 今日头条 (${newsLines.length}条)`);
            newsLines.forEach(line => report.push(line));
            report.push('');
        }
        
        await sleep(500);
        // 1. Fear & Greed Index
        console.log('Fetching Fear & Greed...');
        const fng = await fetch('https://api.alternative.me/fng/?limit=7');
        const fngValue = parseInt(fng.data[0].value);
        const fngClass = fng.data[0].value_classification;
        const fngEmoji = fngValue <= 25 ? '😱' : fngValue <= 45 ? '😨' : fngValue <= 55 ? '😐' : fngValue <= 75 ? '😊' : '🤑';
        
        // Count consecutive days in same zone
        let consecutiveDays = 1;
        const currentZone = fngValue < 30 ? 'fear' : fngValue > 70 ? 'greed' : 'neutral';
        for (let i = 1; i < fng.data.length; i++) {
            const v = parseInt(fng.data[i].value);
            const zone = v < 30 ? 'fear' : v > 70 ? 'greed' : 'neutral';
            if (zone === currentZone) consecutiveDays++;
            else break;
        }
        
        report.push(`## 😱 恐惧贪婪指数`);
        report.push(`**${fngValue} - ${fngClass}** ${fngEmoji}`);
        if (currentZone !== 'neutral') {
            report.push(`连续 ${consecutiveDays} 天处于${currentZone === 'fear' ? '恐惧' : '贪婪'}区间\n`);
        } else {
            report.push('');
        }
        
        await sleep(500);
        
        // 2. BTC/ETH prices from CoinGecko
        console.log('Fetching prices...');
        const prices = await fetch(
            'https://pro-api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true&include_market_cap=true',
            { 'x-cg-pro-api-key': COINGECKO_KEY }
        );
        
        report.push(`## 💰 主要加密货币`);
        report.push(`| 币种 | 价格 | 24h变化 | 市值 |`);
        report.push(`|------|------|---------|------|`);
        report.push(`| BTC | $${formatNum(prices.bitcoin.usd, 0)} | ${changeEmoji(prices.bitcoin.usd_24h_change)} ${formatPct(prices.bitcoin.usd_24h_change)} | $${formatNum(prices.bitcoin.usd_market_cap / 1e12, 2)}T |`);
        report.push(`| ETH | $${formatNum(prices.ethereum.usd, 0)} | ${changeEmoji(prices.ethereum.usd_24h_change)} ${formatPct(prices.ethereum.usd_24h_change)} | $${formatNum(prices.ethereum.usd_market_cap / 1e9, 0)}B |\n`);
        
        await sleep(500);
        
        // 3. Technical indicators (need historical data)
        console.log('Fetching historical data for technicals...');
        const btcHistory = await fetch(
            'https://pro-api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=200&interval=daily',
            { 'x-cg-pro-api-key': COINGECKO_KEY }
        );
        const btcPrices = btcHistory.prices.map(p => p[1]);
        const btcCurrent = btcPrices[btcPrices.length - 1];
        const btcMA200 = calcSMA(btcPrices, 200);
        const btcMA50 = calcSMA(btcPrices, 50);
        const btcRSI = calcRSI(btcPrices);
        const btcDistMA200 = ((btcCurrent - btcMA200) / btcMA200 * 100);
        
        report.push(`## 📈 BTC 技术指标`);
        report.push(`| 指标 | 数值 | 状态 |`);
        report.push(`|------|------|------|`);
        report.push(`| MA50 | $${formatNum(btcMA50, 0)} | ${btcCurrent > btcMA50 ? '✅ 上方' : '❌ 下方'} |`);
        report.push(`| MA200 | $${formatNum(btcMA200, 0)} | ${btcCurrent > btcMA200 ? '🐂 牛市' : '🐻 熊市'} |`);
        report.push(`| RSI(14) | ${btcRSI.toFixed(1)} | ${btcRSI > 70 ? '🔴 超买' : btcRSI < 30 ? '🟢 超卖' : '⚪ 中性'} |`);
        report.push(`| 距MA200 | ${formatPct(btcDistMA200)} | ${btcDistMA200 > 0 ? '牛市区间' : '熊市区间'} |\n`);
        
        await sleep(500);
        
        // 4. CMC Global Metrics
        console.log('Fetching CMC global metrics...');
        const cmcGlobal = await fetch(
            'https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest',
            { 'X-CMC_PRO_API_KEY': CMC_KEY }
        );
        const gd = cmcGlobal.data;
        const quote = gd.quote.USD;
        
        report.push(`## 🌍 全球市场`);
        report.push(`| 指标 | 数值 | 24h变化 |`);
        report.push(`|------|------|---------|`);
        report.push(`| 总市值 | $${formatNum(quote.total_market_cap / 1e12, 2)}T | ${changeEmoji(quote.total_market_cap_yesterday_percentage_change)} ${formatPct(quote.total_market_cap_yesterday_percentage_change)} |`);
        report.push(`| 24h交易量 | $${formatNum(quote.total_volume_24h / 1e9, 1)}B | ${changeEmoji(quote.total_volume_24h_yesterday_percentage_change)} ${formatPct(quote.total_volume_24h_yesterday_percentage_change)} |`);
        report.push(`| BTC主导率 | ${gd.btc_dominance.toFixed(1)}% | ${changeEmoji(gd.btc_dominance_24h_percentage_change)} ${formatPct(gd.btc_dominance_24h_percentage_change)} |`);
        report.push(`| ETH主导率 | ${gd.eth_dominance.toFixed(1)}% | ${changeEmoji(gd.eth_dominance_24h_percentage_change)} ${formatPct(gd.eth_dominance_24h_percentage_change)} |`);
        report.push(`| DeFi市值 | $${quote.defi_market_cap ? formatNum(quote.defi_market_cap / 1e9, 1) : 'N/A'}B | — |`);
        report.push(`| 稳定币市值 | $${quote.stablecoin_market_cap ? formatNum(quote.stablecoin_market_cap / 1e9, 1) : 'N/A'}B | — |\n`);
        
        await sleep(500);
        
        // 5. BTC Mining (Mempool)
        console.log('Fetching mining data...');
        const mining = await fetch('https://mempool.space/api/v1/mining/hashrate/1m');
        const currentHashrate = mining.currentHashrate / 1e18; // Convert to EH/s
        const monthAgoHashrate = mining.hashrates[0].avgHashrate / 1e18;
        const hashrateChange = ((currentHashrate - monthAgoHashrate) / monthAgoHashrate * 100);
        const currentDifficulty = mining.currentDifficulty / 1e12; // Convert to T
        
        // Count difficulty adjustments
        let diffAdjustments = '';
        if (mining.difficulty && mining.difficulty.length > 0) {
            const lastAdj = mining.difficulty[mining.difficulty.length - 1];
            const adjPct = ((lastAdj.adjustment - 1) * 100).toFixed(2);
            diffAdjustments = `最近调整: ${adjPct > 0 ? '+' : ''}${adjPct}%`;
        }
        
        report.push(`## ⛏️ BTC 挖矿`);
        report.push(`| 指标 | 数值 | 趋势 |`);
        report.push(`|------|------|------|`);
        report.push(`| 算力 | ${formatNum(currentHashrate, 0)} EH/s | ${changeEmoji(hashrateChange)} 月变化 ${formatPct(hashrateChange)} |`);
        report.push(`| 难度 | ${formatNum(currentDifficulty, 2)}T | ${diffAdjustments} |\n`);
        
        await sleep(1500); // Alpha Vantage rate limit
        
        // 6. Traditional Finance (Alpha Vantage)
        console.log('Fetching traditional finance...');
        const symbols = ['GLD', 'TLT', 'SPY'];
        const tfData = {};
        
        for (const sym of symbols) {
            const data = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${sym}&apikey=${ALPHA_VANTAGE_KEY}`);
            if (data['Global Quote']) {
                tfData[sym] = {
                    price: parseFloat(data['Global Quote']['05. price']),
                    change: parseFloat(data['Global Quote']['10. change percent'].replace('%', ''))
                };
            }
            await sleep(1500);
        }
        
        report.push(`## 📊 传统市场`);
        report.push(`| 资产 | 价格 | 日涨跌 |`);
        report.push(`|------|------|--------|`);
        if (tfData.GLD) report.push(`| 黄金 (GLD) | $${formatNum(tfData.GLD.price, 2)} | ${changeEmoji(tfData.GLD.change)} ${formatPct(tfData.GLD.change)} |`);
        if (tfData.TLT) report.push(`| 美债 (TLT) | $${formatNum(tfData.TLT.price, 2)} | ${changeEmoji(tfData.TLT.change)} ${formatPct(tfData.TLT.change)} |`);
        if (tfData.SPY) report.push(`| S&P500 (SPY) | $${formatNum(tfData.SPY.price, 2)} | ${changeEmoji(tfData.SPY.change)} ${formatPct(tfData.SPY.change)} |`);
        report.push('');
        
        // Footer
        report.push(`---`);
        report.push(`*数据来源: CoinGecko, CMC, Mempool, Alternative.me, Alpha Vantage*`);
        report.push(`*ETF流向和链上数据需浏览器抓取，请单独查询*`);
        
    } catch (err) {
        report.push(`\n⚠️ 部分数据获取失败: ${err.message}`);
    }
    
    // Output
    console.log('\n' + '='.repeat(50));
    console.log(report.join('\n'));
    console.log('='.repeat(50));
    
    return report.join('\n');
}

// Run
main().catch(console.error);
