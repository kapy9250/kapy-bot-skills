# 整点市场报告协议

## 目标
每小时提供一次简洁的市场快照，包含：
1. 📰 **最近一小时的重要新闻**（2-3条）
2. 💰 **价格快照**（BTC/ETH + 24h变化）
3. 😱 **情绪指标**（恐惧贪婪指数）
4. 📊 **关键技术指标**（RSI、距MA200）

## 执行流程

### 1. 获取最近一小时新闻
```bash
web_search "bitcoin crypto news" --freshness ph --count 3
```

**筛选规则:**
- 优先市场动态（价格、波动、监管）
- 过滤重复内容
- 只保留最重要的 2-3 条
- 格式: `🔴/🟢 [标题]`

### 2. 获取价格数据
```bash
curl -s "https://pro-api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true" \
  -H "x-cg-pro-api-key: CG-UmFBz86Ceq5Q5tSPqm1kVzbW"
```

### 3. 获取恐惧贪婪指数
```bash
curl -s "https://api.alternative.me/fng/?limit=1"
```

### 4. 计算 RSI（如果需要）
使用缓存的历史数据计算，避免每小时都拉取 200 天数据

## 输出模板

```markdown
📊 **整点市场快照** HH:00 UTC

━━━━━━━━━━━━━━━━━━━━━━━━

📰 **最近一小时**

🔴 [新闻标题1]
🟢 [新闻标题2]
ℹ️ [新闻标题3]

━━━━━━━━━━━━━━━━━━━━━━━━

💰 **价格**
• BTC: $XX,XXX (🔴 -X.X%)
• ETH: $X,XXX (🔴 -X.X%)

━━━━━━━━━━━━━━━━━━━━━━━━

😱 **情绪**
恐惧贪婪: XX ([状态])

━━━━━━━━━━━━━━━━━━━━━━━━

📈 **技术**
• RSI(14): XX.X ([超买/超卖/中性])
• 距MA200: -XX.X% (🐻 熊市)
```

## 与日报的区别

| 维度 | 整点报告 | 日报 |
|------|----------|------|
| 频率 | 每小时 | 每天 |
| 新闻 | 最近1小时 | 当日综合 |
| 数据 | 快照式 | 完整分析 |
| 长度 | 简洁 | 详细 |
| 技术指标 | RSI + MA200 | 全套（MA50/MA200/RSI/MACD） |
| 宏观数据 | 无 | 股票/黄金/债券 |
| 挖矿数据 | 无 | 有 |

## 实现方式

**不使用独立脚本**，直接在 Clawdbot 中执行：
1. web_search 获取新闻
2. exec curl 获取价格和恐惧贪婪
3. 组装 Telegram 消息格式
4. message tool 发送到 kapy-news 频道

**缓存机制:**
- 历史价格数据缓存 24 小时
- 避免每小时重复拉取 200 天数据
- 缓存文件: `/workspace/market-data/cache/btc-history.json`

## Cron 配置

```json
{
  "name": "hourly-market-report",
  "schedule": {
    "kind": "cron",
    "expr": "0 * * * *",
    "tz": "UTC"
  },
  "payload": {
    "kind": "agentTurn",
    "message": "生成并发送整点市场报告到 kapy-news 频道。包含: 1) 最近一小时新闻 2) BTC/ETH价格 3) 恐惧贪婪指数 4) 关键技术指标。使用 HOURLY_REPORT.md 协议。",
    "timeoutSeconds": 120
  },
  "sessionTarget": "isolated",
  "enabled": true
}
```

## 注意事项
- Alpha Vantage 限额 25次/天，整点报告**不使用**传统金融数据
- 新闻搜索优先 `freshness=ph` (past hour)，如无结果回退到 `pd` (past day)
- 避免重复发送相同新闻（对比上一次报告）
