#!/usr/bin/env node
/**
 * Technical Analysis Calculator
 * 计算 RSI, MACD, MA 等技术指标
 * 
 * Usage:
 *   node technical-analysis.js <btc_prices.json> <eth_prices.json>
 */

const fs = require('fs');

// Calculate SMA (Simple Moving Average)
function sma(prices, period) {
    if (prices.length < period) return null;
    const slice = prices.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
}

// Calculate EMA (Exponential Moving Average)
function ema(prices, period) {
    if (prices.length < period) return null;
    const k = 2 / (period + 1);
    let emaVal = sma(prices.slice(0, period), period);
    for (let i = period; i < prices.length; i++) {
        emaVal = prices[i] * k + emaVal * (1 - k);
    }
    return emaVal;
}

// Calculate RSI (Relative Strength Index)
function rsi(prices, period = 14) {
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
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

// Calculate MACD
function macd(prices) {
    const ema12 = ema(prices, 12);
    const ema26 = ema(prices, 26);
    if (!ema12 || !ema26) return null;
    
    const macdLine = ema12 - ema26;
    
    // Calculate signal line (9-day EMA of MACD)
    const macdHistory = [];
    for (let i = 26; i <= prices.length; i++) {
        const e12 = ema(prices.slice(0, i), 12);
        const e26 = ema(prices.slice(0, i), 26);
        macdHistory.push(e12 - e26);
    }
    const signal = ema(macdHistory, 9);
    const histogram = macdLine - signal;
    
    return { macd: macdLine, signal, histogram };
}

// Find support/resistance levels
function findLevels(prices) {
    const recent = prices.slice(-30);
    const high = Math.max(...recent);
    const low = Math.min(...recent);
    const current = prices[prices.length - 1];
    
    // Fibonacci levels from recent high/low
    const diff = high - low;
    const fib382 = high - diff * 0.382;
    const fib500 = high - diff * 0.5;
    const fib618 = high - diff * 0.618;
    
    return { high, low, fib382, fib500, fib618, current };
}

// Analyze a coin
function analyze(name, prices) {
    const current = prices[prices.length - 1];
    const ma50 = sma(prices, 50);
    const ma100 = sma(prices, 100);
    const ma200 = sma(prices, 200);
    const rsiVal = rsi(prices);
    const macdVal = macd(prices);
    const levels = findLevels(prices);
    
    // Determine trend
    let trend = '—';
    if (current > ma200) trend = '📈 牛市区间 (价格 > MA200)';
    else trend = '📉 熊市区间 (价格 < MA200)';
    
    const distMA200 = ((current - ma200) / ma200 * 100);
    
    return {
        name,
        current,
        ma50,
        ma100,
        ma200,
        rsi: rsiVal,
        macd: macdVal,
        levels,
        trend,
        distMA200,
        aboveMa50: current > ma50,
        aboveMa100: current > ma100,
        aboveMa200: current > ma200,
        rsiStatus: rsiVal > 70 ? '超买' : rsiVal < 30 ? '超卖' : '中性',
        macdStatus: macdVal.histogram > 0 ? '多头' : '空头'
    };
}

// Format output
function formatAnalysis(analysis) {
    const a = analysis;
    console.log(`\n### ${a.name} — $${a.current.toFixed(2)}`);
    console.log(`| 指标 | 数值 | 状态 |`);
    console.log(`|------|------|------|`);
    console.log(`| 当前价格 | $${a.current.toFixed(2)} | ${a.trend} |`);
    console.log(`| MA50 | $${a.ma50.toFixed(2)} | ${a.aboveMa50 ? '✅ 上方' : '❌ 下方'} |`);
    console.log(`| MA100 | $${a.ma100.toFixed(2)} | ${a.aboveMa100 ? '✅ 上方' : '❌ 下方'} |`);
    console.log(`| **MA200 (牛熊线)** | **$${a.ma200.toFixed(2)}** | **${a.aboveMa200 ? '🐂 牛' : '🐻 熊'}** |`);
    console.log(`| RSI(14) | ${a.rsi.toFixed(1)} | ${a.rsiStatus === '超买' ? '🔴' : a.rsiStatus === '超卖' ? '🟢' : '⚪'} ${a.rsiStatus} |`);
    console.log(`| MACD | ${a.macd.macd.toFixed(2)} | ${a.macdStatus === '多头' ? '📈' : '📉'} ${a.macdStatus} |`);
    console.log(`| MACD Signal | ${a.macd.signal.toFixed(2)} | — |`);
    console.log(`| MACD Histogram | ${a.macd.histogram.toFixed(2)} | ${a.macd.histogram > 0 ? '🟢' : '🔴'} |`);
    
    console.log(`\n**关键价位：**`);
    console.log(`- 30日高点: $${a.levels.high.toFixed(2)}`);
    console.log(`- 30日低点: $${a.levels.low.toFixed(2)}`);
    console.log(`- Fib 0.382: $${a.levels.fib382.toFixed(2)}`);
    console.log(`- Fib 0.5: $${a.levels.fib500.toFixed(2)}`);
    console.log(`- Fib 0.618: $${a.levels.fib618.toFixed(2)}`);
    console.log(`- 距MA200: ${a.distMA200 > 0 ? '+' : ''}${a.distMA200.toFixed(2)}%`);
}

// Main
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        // Demo mode with inline data
        console.log('## 📊 技术指标分析 (Demo)');
        console.log('Usage: node technical-analysis.js <prices.json>');
        console.log('JSON format: {"prices": [[timestamp, price], ...]}');
        process.exit(0);
    }
    
    for (const file of args) {
        try {
            const data = JSON.parse(fs.readFileSync(file, 'utf8'));
            const prices = data.prices.map(p => p[1]);
            const name = file.includes('btc') ? 'BTC' : file.includes('eth') ? 'ETH' : 'Asset';
            const analysis = analyze(name, prices);
            formatAnalysis(analysis);
        } catch (e) {
            console.error(`Error processing ${file}: ${e.message}`);
        }
    }
}

module.exports = { sma, ema, rsi, macd, findLevels, analyze };
