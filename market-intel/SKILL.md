---
name: market-intel
description: 加密货币和金融市场情报技能。获取BTC/ETH价格、技术指标(RSI/MACD/MA200)、链上数据、ETF流向、美股、黄金、美债等数据。支持中文输出。Use when asked about crypto prices, market data, technical analysis, ETF flows, stock prices, gold, or financial market intelligence.
---

# Market Intel (市场情报)

获取加密货币和传统金融市场的实时数据和技术分析。

## 数据源概览

### 加密货币价格
| 来源 | API Key | 端点 | 用途 |
|------|---------|------|------|
| **CoinGecko Pro** | `x-cg-pro-api-key` | `pro-api.coingecko.com` | 价格、市值、历史数据 |
| **CoinMarketCap** | `X-CMC_PRO_API_KEY` | `pro-api.coinmarketcap.com` | 全球指标、Top币种、ETF数据 |

### 传统金融
| 来源 | API Key | 用途 | 限制 |
|------|---------|------|------|
| **Alpha Vantage** | `apikey` | 股票、黄金ETF、债券ETF | 25次/天 (免费) |

### 免费数据源 (无需Key)
| 来源 | 数据类型 |
|------|----------|
| **Mempool.space** | BTC算力、难度、区块数据 |
| **Alternative.me** | 恐惧贪婪指数 |
| **DeFiLlama Fees** | 协议费用 (24h/7d/30d) |
| **DeFiLlama Stablecoins** | 稳定币流通量、变化 |
| **DeFiLlama TVL** | 链TVL数据 |

## API Keys 位置

从 `TOOLS.md` 读取:
```
### Crypto Data
- CoinGecko Pro: CG-xxx
- CoinMarketCap: xxx

### Traditional Finance
- Alpha Vantage: xxx
```

## 数据获取命令

### 1. 加密货币价格 (CoinGecko)

```bash
# 基础价格
curl -s "https://pro-api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true&include_market_cap=true" \
  -H "x-cg-pro-api-key: $COINGECKO_KEY"

# 历史价格 (用于计算技术指标)
curl -s "https://pro-api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=200&interval=daily" \
  -H "x-cg-pro-api-key: $COINGECKO_KEY"

# 全球市场数据
curl -s "https://pro-api.coingecko.com/api/v3/global" \
  -H "x-cg-pro-api-key: $COINGECKO_KEY"
```

### 2. 全球加密指标 (CoinMarketCap)

```bash
# 全球指标 (市值、BTC主导率、DeFi、稳定币、衍生品)
curl -s "https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest" \
  -H "X-CMC_PRO_API_KEY: $CMC_KEY"

# Top 10 币种 (含24h/7d/30d/60d/90d变化)
curl -s "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=10&convert=USD" \
  -H "X-CMC_PRO_API_KEY: $CMC_KEY"
```

### 3. BTC 挖矿数据 (Mempool.space - 免费)

```bash
# 最近30天算力和难度
curl -s "https://mempool.space/api/v1/mining/hashrate/1m"

# 返回: hashrates[], difficulty[], currentHashrate, currentDifficulty
```

### 4. 恐惧贪婪指数 (Alternative.me - 免费)

```bash
curl -s "https://api.alternative.me/fng/?limit=1"
# 返回: value (0-100), value_classification (Extreme Fear/Fear/Neutral/Greed/Extreme Greed)
```

### 5. DeFi 数据 (DeFiLlama - 免费)

```bash
# 协议费用 (24h/7d/30d, 1800+ 协议)
curl -s "https://api.llama.fi/overview/fees"
# 返回: total24h, total7d, protocols[], totalDataChart[]

# 稳定币数据 (330+ 稳定币)
curl -s "https://stablecoins.llama.fi/stablecoins"
# 返回: peggedAssets[{name, symbol, circulating, circulatingPrevDay, chainCirculating}]

# 链 TVL
curl -s "https://api.llama.fi/v2/chains"
# 返回: [{name, tvl, tokenSymbol}]
```

**脚本抓取:**
```bash
cd /workspace/market-data && node scripts/fetch-defi.js
# 输出: raw/defi/YYYY-MM-DD.json
```

### 6. BTC ETF 资金流 (Farside 直连 - 推荐)

使用 CDP 直接抓取 Farside Investors 的表格数据，获取精确的每日流入流出。

```bash
# 运行抓取脚本
node /workspace/market-data/scripts/fetch-etf-direct.js

# 输出: /workspace/market-data/raw/etf/latest-etf-flow.json
# 包含: 日期, 总净流, IBIT, FBTC, GBTC 等明细
```

### 7. 股票/黄金/债券 (Alpha Vantage)

```bash
# 单个股票
curl -s "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=$AV_KEY"

# 常用标的:
# - SPY (S&P500 ETF)
# - GLD (黄金 ETF)
# - TLT (20+年美债 ETF)
# - IBIT (BlackRock BTC ETF)
# - GBTC (Grayscale BTC Trust)
# - 科技股: AAPL, MSFT, GOOGL, AMZN, NVDA, META, TSLA, AVGO, TSM, ORCL

# 注意: 免费版限25次/天，需间隔1秒以上
```

## 技术指标计算

从历史价格计算 RSI、MACD、MA 等指标。

### Node.js 计算脚本

```javascript
// 计算 SMA
function sma(prices, period) {
    if (prices.length < period) return null;
    const slice = prices.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
}

// 计算 EMA
function ema(prices, period) {
    if (prices.length < period) return null;
    const k = 2 / (period + 1);
    let emaVal = sma(prices.slice(0, period), period);
    for (let i = period; i < prices.length; i++) {
        emaVal = prices[i] * k + emaVal * (1 - k);
    }
    return emaVal;
}

// 计算 RSI (14日)
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
    return 100 - (100 / (1 + avgGain / avgLoss));
}

// 计算 MACD (12, 26, 9)
function macd(prices) {
    const ema12 = ema(prices, 12);
    const ema26 = ema(prices, 26);
    if (!ema12 || !ema26) return null;
    const macdLine = ema12 - ema26;
    // Signal line 需要历史 MACD 值
    return { macd: macdLine };
}

// RSI 解读
// > 70: 超买 (可能回调)
// < 30: 超卖 (可能反弹)
// 30-70: 中性

// MA200 解读
// 价格 > MA200: 牛市区间
// 价格 < MA200: 熊市区间
```

## 输出模板

### 快速市场快照

```
## 📊 市场快照 (YYYY-MM-DD HH:MM UTC)

### 加密货币
| 资产 | 价格 | 24h | 市值 |
|------|------|-----|------|
| BTC | $XX,XXX | +X.X% | $X.XXT |
| ETH | $X,XXX | +X.X% | $XXXB |

### 恐惧贪婪指数
**XX — [状态]** [emoji]

### BTC 挖矿
- 算力: XXX EH/s
- 难度: XXX T
- 趋势: [上升/下降] [百分比]
```

### 完整技术分析

```
## 📊 技术指标分析

### BTC — $XX,XXX
| 指标 | 数值 | 状态 |
|------|------|------|
| MA50 | $XX,XXX | ✅/❌ 上方/下方 |
| MA100 | $XX,XXX | ✅/❌ |
| **MA200 (牛熊线)** | **$XX,XXX** | **🐂/🐻** |
| RSI(14) | XX.X | 🔴超买/🟢超卖/⚪中性 |
| MACD | XXX | 📈多头/📉空头 |

**关键价位：**
- 30日高点: $XX,XXX
- 30日低点: $XX,XXX
- Fib 0.382: $XX,XXX
- Fib 0.5: $XX,XXX
- Fib 0.618: $XX,XXX
- 距MA200: ±X.X%
```

### 全市场报告

```
## 📊 全市场综合报告 (日期)

### 🌍 加密市场总览
| 指标 | 数值 | 24h变化 |
|------|------|---------|
| 总市值 | $X.XT | +X.X% |
| 24h交易量 | $XXXB | +X.X% |
| BTC主导率 | XX.X% | +X.X% |
| ETH主导率 | XX.X% | +X.X% |

### 📈 DeFi / 稳定币 / 衍生品
| 类别 | 市值 | 24h交易量 | 变化 |
|------|------|-----------|------|
| DeFi | $XXB | $XXB | +X% |
| 稳定币 | $XXXB | $XXXB | +X% |
| 衍生品 | — | $XXXB | +X% |

### 🏆 Top 10 表现
| # | 币种 | 价格 | 24h | 7d | 30d | 90d |
|---|------|------|-----|-----|-----|-----|
| 1 | BTC | $XX,XXX | +X% | -X% | +X% | -X% |
...

### 🥇 黄金 & 债券
| 资产 | 价格 | 日涨跌 |
|------|------|--------|
| GLD | $XXX | +X.X% |
| TLT | $XX | +X.X% |

### ₿ BTC ETF
| ETF | 价格 | 日涨跌 |
|-----|------|--------|
| IBIT | $XX | +X.X% |
| GBTC | $XX | +X.X% |

### 💻 美股科技 Top 10
| 股票 | 价格 | 日涨跌 |
|------|------|--------|
| AAPL | $XXX | +X.X% |
...

### ⛏️ BTC 挖矿趋势
- 月初算力: XXX EH/s
- 当前算力: XXX EH/s
- 趋势: 📈/📉 [变化%]
- 难度调整: [最近调整记录]
```

## ETF 流向数据

由于 Farside/SoSoValue/CoinGlass 有 Cloudflare 保护，ETF 流向数据通过以下方式获取:

### 方式1: 脚本抓取 (推荐)
```bash
# 获取 ETF 价格 (Alpha Vantage)
cd /workspace/market-data && node scripts/fetch-etf.js

# 支持的 ETF:
# BTC: IBIT, GBTC, FBTC, ARKB, BITB
# ETH: ETHA, ETHE
# 对比: GLD, TLT, SPY
```

### 方式2: 新闻聚合 (流向数据)
```bash
# 搜索 ETF 流向新闻
web_search "Bitcoin ETF flow IBIT GBTC daily inflow outflow" --freshness pw
```

### 数据存储
- 价格数据: `/workspace/market-data/raw/etf/YYYY-MM-DD.json`
- 流向新闻: `/workspace/market-data/raw/etf/YYYY-MM-DD-flow-news.json`
- 最新数据: `/workspace/market-data/raw/etf/latest.json`

### Alpha Vantage 限制
- 免费版: 25次/天
- 请求间隔: >1秒
- 10个ETF约需15秒

## 浏览器功能

已配置远程 Chrome 浏览器 (宿主机 Docker 模式)。

```
Chrome CDP: ws://172.30.0.3:9222
User-Agent: Chrome/144.0.0.0 (无 HeadlessChrome 标识)
```

### 交易所余额抓取 (CoinGlass)
```bash
cd /workspace/market-data && node scripts/fetch-exchange-balance.js

# 输出数据:
# - BTC/ETH 交易所余额
# - 24h/7d/30d 变化
# - Top 20 交易所明细
```

**✅ 已测试可访问的网站:**

| 网站 | 数据类型 |
|------|----------|
| **Farside** | BTC/ETH/SOL ETF 每日流向 |
| **CoinGlass** | ETF 累计数据、衍生品 |
| **Whale Alert** | 大额转账实时警报 |
| **Cointelegraph** | 新闻 + 价格行情 |
| **CryptoQuant** | 链上数据、交易所流向 |
| **Yahoo Finance** | DXY、VIX、传统股票 |

**浏览器抓取命令:**

```javascript
// 打开页面
browser.navigate({ targetUrl: "https://farside.co.uk/btc/", profile: "raspi" })

// 等待加载
sleep(5000)

// 获取快照
browser.snapshot({ profile: "raspi", maxChars: 15000 })
```

**限制:**
- 需要宿主机 Chromium + Xvfb 进程持续运行
- 部分页面需要等待 JS 渲染

## 注意事项

1. **Alpha Vantage 限制**: 免费版 25次/天，请求间隔 > 1秒
2. **CoinGecko Pro**: 使用 `pro-api.coingecko.com` 端点
3. **技术指标**: 需要 200 天历史数据计算 MA200
4. **ETF 数据**: 主要依赖新闻和价格数据，流向需手动查询
5. **Cloudflare**: 大部分金融网站有保护，headless 浏览器受限

## 每日简报脚本

`scripts/daily-report.js` - 自动生成市场日报

**运行方式:**
```bash
node /workspace/skills/market-intel/scripts/daily-report.js
```

**输出内容:**
- 📰 今日新闻摘要 (web_search 抓取)
- 😱 恐惧贪婪指数 + 连续天数
- 💰 BTC/ETH 价格和24h变化
- 📈 BTC 技术指标 (MA50/MA200/RSI)
- 🌍 全球市场指标 (市值/交易量/主导率)
- ⛏️ BTC 挖矿数据 (算力/难度趋势)
- 📊 传统市场 (黄金/美债/S&P500)
- ₿ ETF 流向 (浏览器抓取 Farside)

**Discord 发送:**
- 频道: `1465554536465694872` (服务器 `1440592518856052911`)
- 使用 message tool 或 sub-agent 发送

## 新闻抓取

使用 `web_search` 获取最新新闻：

```bash
# 搜索今日 crypto 新闻
web_search "bitcoin crypto news today" --freshness pd --count 8
```

**新闻来源优先级：**
1. CoinDesk — 权威市场新闻
2. Bloomberg — 主流媒体视角
3. Cointelegraph — 行业深度
4. The Block — 机构动向
5. Yahoo Finance — 综合财经

**新闻分类：**
- 🔴 市场动态 (价格、波动)
- 📊 资金流向 (ETF、机构)
- 🔮 观点预测 (分析师、KOL)
- ⚠️ 风险事件 (监管、黑客)
- ⏰ 即将发生 (会议、发布)

## 使用示例

**用户请求:** "查看今天的市场数据"

**执行步骤:**
1. web_search 获取今日新闻
2. 获取 BTC/ETH 价格 (CoinGecko)
3. 运行 ETF 抓取脚本 (`fetch-etf-direct.js`)
4. 获取恐惧贪婪指数 (Alternative.me)
5. 获取 BTC 算力难度 (Mempool)
6. 整理输出

**用户请求:** "BTC 技术分析"

**执行步骤:**
1. 获取 200 天历史价格 (CoinGecko)
2. 计算 MA50/MA100/MA200
3. 计算 RSI(14)
4. 计算 MACD
5. 输出技术分析报告
