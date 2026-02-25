#!/usr/bin/env node
/**
 * BTC 快速分析脚本
 * 读取 digest 数据，输出关键指标和信号
 * 
 * 用法: node analyze.js [--json]
 */

const fs = require('fs');
const path = require('path');

const DIGEST_PATH = '/workspace/market-data/digest/latest.json';

function loadDigest() {
    try {
        return JSON.parse(fs.readFileSync(DIGEST_PATH, 'utf8'));
    } catch (e) {
        console.error('❌ 无法读取 digest:', e.message);
        process.exit(1);
    }
}

function analyzeTechnicals(tech, price) {
    if (!tech) return { score: 0, signals: [] };
    
    const signals = [];
    let score = 0;
    
    // RSI analysis
    if (tech.rsi !== null) {
        if (tech.rsi < 20) {
            signals.push({ type: 'bullish', strength: 'strong', msg: `RSI 极度超卖 (${tech.rsi.toFixed(1)})` });
            score += 30;
        } else if (tech.rsi < 30) {
            signals.push({ type: 'bullish', strength: 'moderate', msg: `RSI 超卖 (${tech.rsi.toFixed(1)})` });
            score += 15;
        } else if (tech.rsi > 80) {
            signals.push({ type: 'bearish', strength: 'strong', msg: `RSI 极度超买 (${tech.rsi.toFixed(1)})` });
            score -= 30;
        } else if (tech.rsi > 70) {
            signals.push({ type: 'bearish', strength: 'moderate', msg: `RSI 超买 (${tech.rsi.toFixed(1)})` });
            score -= 15;
        }
    }
    
    // MA200 analysis
    if (tech.ma200 && price) {
        const distance = ((price / tech.ma200) - 1) * 100;
        if (distance < -30) {
            signals.push({ type: 'bullish', strength: 'strong', msg: `深度折价于MA200 (${distance.toFixed(1)}%)` });
            score += 20;
        } else if (distance < -10) {
            signals.push({ type: 'bullish', strength: 'moderate', msg: `折价于MA200 (${distance.toFixed(1)}%)` });
            score += 10;
        } else if (distance > 50) {
            signals.push({ type: 'bearish', strength: 'strong', msg: `大幅溢价于MA200 (${distance.toFixed(1)}%)` });
            score -= 20;
        } else if (distance > 20) {
            signals.push({ type: 'bearish', strength: 'moderate', msg: `溢价于MA200 (${distance.toFixed(1)}%)` });
            score -= 10;
        }
    }
    
    // Trend
    if (tech.trend === 'bearish') {
        signals.push({ type: 'bearish', strength: 'moderate', msg: '趋势看空' });
        score -= 10;
    } else if (tech.trend === 'bullish') {
        signals.push({ type: 'bullish', strength: 'moderate', msg: '趋势看多' });
        score += 10;
    }
    
    return { score, signals };
}

function analyzeSentiment(sentiment) {
    if (!sentiment) return { score: 0, signals: [] };
    
    const signals = [];
    let score = 0;
    const fg = sentiment.fear_greed;
    const streak = sentiment.streak?.days || 0;
    
    // Fear & Greed
    if (fg <= 10) {
        signals.push({ type: 'bullish', strength: 'strong', msg: `极度恐惧 (${fg}) - 历史底部区间` });
        score += 25;
    } else if (fg <= 25) {
        signals.push({ type: 'bullish', strength: 'moderate', msg: `恐惧 (${fg}) - 逆向做多区` });
        score += 15;
    } else if (fg >= 90) {
        signals.push({ type: 'bearish', strength: 'strong', msg: `极度贪婪 (${fg}) - 历史顶部区间` });
        score -= 25;
    } else if (fg >= 75) {
        signals.push({ type: 'bearish', strength: 'moderate', msg: `贪婪 (${fg}) - 逆向做空区` });
        score -= 15;
    }
    
    // Streak amplifier
    if (streak >= 7) {
        const dir = sentiment.streak.direction;
        if (dir === 'fear') {
            signals.push({ type: 'bullish', strength: 'moderate', msg: `连续${streak}天恐惧 - 情绪可能反转` });
            score += 10;
        } else {
            signals.push({ type: 'bearish', strength: 'moderate', msg: `连续${streak}天贪婪 - 情绪可能反转` });
            score -= 10;
        }
    }
    
    return { score, signals };
}

function analyzeDerivatives(deriv) {
    if (!deriv) return { score: 0, signals: [] };
    
    const signals = [];
    let score = 0;
    
    // Funding rate
    if (deriv.btc_funding_rate !== undefined) {
        const fr = deriv.btc_funding_rate;
        if (fr < -0.02) {
            signals.push({ type: 'bullish', strength: 'moderate', msg: `负资金费率 (${fr.toFixed(4)}%) - 轧空条件` });
            score += 15;
        } else if (fr > 0.05) {
            signals.push({ type: 'bearish', strength: 'moderate', msg: `高资金费率 (${fr.toFixed(4)}%) - 多头过热` });
            score -= 15;
        }
    }
    
    // Long/Short ratio
    if (deriv.long_ratio !== undefined) {
        if (deriv.long_ratio > 75) {
            signals.push({ type: 'bearish', strength: 'weak', msg: `多头拥挤 (${deriv.long_ratio}%)` });
            score -= 5;
        } else if (deriv.long_ratio < 40) {
            signals.push({ type: 'bullish', strength: 'weak', msg: `空头主导 (多${deriv.long_ratio}%)` });
            score += 5;
        }
    }
    
    return { score, signals };
}

function analyzeETF(etf) {
    if (!etf) return { score: 0, signals: [] };
    
    const signals = [];
    let score = 0;
    
    const streak = etf.streak;
    if (streak && streak.days >= 3) {
        if (streak.direction === 'inflow') {
            signals.push({ type: 'bullish', strength: 'moderate', msg: `ETF 连续${streak.days}天流入` });
            score += 10;
        } else {
            signals.push({ type: 'bearish', strength: 'moderate', msg: `ETF 连续${streak.days}天流出` });
            score -= 10;
        }
    }
    
    return { score, signals };
}

function analyzeMining(mining) {
    if (!mining) return { score: 0, signals: [] };
    
    const signals = [];
    let score = 0;
    
    const change = parseFloat(mining.hashrate_30d_change);
    if (!isNaN(change)) {
        if (change < -10) {
            signals.push({ type: 'bearish', strength: 'moderate', msg: `算力大幅下降 (${change}%) - 矿工压力` });
            score -= 10;
            // But could also be capitulation bottom signal
            signals.push({ type: 'bullish', strength: 'weak', msg: '可能是矿工投降底部信号' });
            score += 5;
        } else if (change > 10) {
            signals.push({ type: 'bullish', strength: 'weak', msg: `算力上升 (${change}%) - 网络健康` });
            score += 5;
        }
    }
    
    return { score, signals };
}

function getOverallRating(totalScore) {
    if (totalScore >= 60) return { rating: '⭐⭐⭐⭐⭐', label: '强烈看多', color: '🟢🟢' };
    if (totalScore >= 30) return { rating: '⭐⭐⭐⭐☆', label: '看多', color: '🟢' };
    if (totalScore >= 10) return { rating: '⭐⭐⭐☆☆', label: '中性偏多', color: '🟢' };
    if (totalScore >= -10) return { rating: '⭐⭐⭐☆☆', label: '中性', color: '⚪' };
    if (totalScore >= -30) return { rating: '⭐⭐☆☆☆', label: '中性偏空', color: '🔴' };
    if (totalScore >= -60) return { rating: '⭐☆☆☆☆', label: '看空', color: '🔴' };
    return { rating: '☆☆☆☆☆', label: '强烈看空', color: '🔴🔴' };
}

function analyze() {
    const digest = loadDigest();
    const price = digest.prices?.btc?.price;
    
    // Run all analyses
    const techAnalysis = analyzeTechnicals(digest.technicals?.btc, price);
    const sentimentAnalysis = analyzeSentiment(digest.sentiment);
    const derivAnalysis = analyzeDerivatives(digest.derivatives);
    const etfAnalysis = analyzeETF(digest.etf);
    const miningAnalysis = analyzeMining(digest.mining);
    
    // Combine scores (weighted)
    const totalScore = 
        techAnalysis.score * 0.30 +
        sentimentAnalysis.score * 0.25 +
        derivAnalysis.score * 0.20 +
        etfAnalysis.score * 0.15 +
        miningAnalysis.score * 0.10;
    
    // Collect all signals
    const allSignals = [
        ...techAnalysis.signals,
        ...sentimentAnalysis.signals,
        ...derivAnalysis.signals,
        ...etfAnalysis.signals,
        ...miningAnalysis.signals
    ];
    
    const bullishSignals = allSignals.filter(s => s.type === 'bullish');
    const bearishSignals = allSignals.filter(s => s.type === 'bearish');
    
    const rating = getOverallRating(totalScore);
    
    return {
        date: digest.date,
        generated_at: new Date().toISOString(),
        price: price,
        totalScore: Math.round(totalScore),
        rating: rating,
        breakdown: {
            technical: { score: techAnalysis.score, weight: 0.30 },
            sentiment: { score: sentimentAnalysis.score, weight: 0.25 },
            derivatives: { score: derivAnalysis.score, weight: 0.20 },
            etf: { score: etfAnalysis.score, weight: 0.15 },
            mining: { score: miningAnalysis.score, weight: 0.10 }
        },
        bullishSignals,
        bearishSignals,
        alerts: digest.alerts || []
    };
}

function formatReport(analysis) {
    const lines = [];
    
    lines.push(`📊 **BTC 快速分析** | ${analysis.date}`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(``);
    lines.push(`**价格**: $${analysis.price?.toLocaleString() || 'N/A'}`);
    lines.push(`**综合评分**: ${analysis.totalScore} / 100`);
    lines.push(`**评级**: ${analysis.rating.rating} ${analysis.rating.label} ${analysis.rating.color}`);
    lines.push(``);
    
    lines.push(`**分项得分**:`);
    Object.entries(analysis.breakdown).forEach(([key, val]) => {
        const name = { technical: '技术面', sentiment: '情绪面', derivatives: '衍生品', etf: 'ETF流向', mining: '挖矿' }[key];
        lines.push(`• ${name}: ${val.score > 0 ? '+' : ''}${val.score} (权重${val.weight * 100}%)`);
    });
    lines.push(``);
    
    if (analysis.bullishSignals.length > 0) {
        lines.push(`🟢 **利多信号** (${analysis.bullishSignals.length})`);
        analysis.bullishSignals.forEach(s => {
            const strength = s.strength === 'strong' ? '💪' : s.strength === 'moderate' ? '' : '(弱)';
            lines.push(`• ${strength} ${s.msg}`);
        });
        lines.push(``);
    }
    
    if (analysis.bearishSignals.length > 0) {
        lines.push(`🔴 **利空信号** (${analysis.bearishSignals.length})`);
        analysis.bearishSignals.forEach(s => {
            const strength = s.strength === 'strong' ? '⚠️' : s.strength === 'moderate' ? '' : '(弱)';
            lines.push(`• ${strength} ${s.msg}`);
        });
        lines.push(``);
    }
    
    if (analysis.alerts.length > 0) {
        lines.push(`⚠️ **警报**`);
        analysis.alerts.forEach(a => {
            lines.push(`• ${a.message}`);
        });
        lines.push(``);
    }
    
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`*Kapybara Capital | NFA*`);
    
    return lines.join('\n');
}

// Main
if (require.main === module) {
    const analysis = analyze();
    
    if (process.argv.includes('--json')) {
        console.log(JSON.stringify(analysis, null, 2));
    } else {
        console.log(formatReport(analysis));
    }
}

module.exports = { analyze, formatReport, loadDigest };
