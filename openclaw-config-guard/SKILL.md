---
name: openclaw-config-guard
description: Shared safety workflow for modifying /home/node/.openclaw OpenClaw configs. Template-first, diff review/reflection, then sync-and-commit. Use for any OpenClaw config change, bot/model/channel bindings, cron config, or credential policy changes.
triggers:
  - openclaw 配置
  - /home/node/.openclaw
  - openclaw.json
  - clawdbot.json
  - bot token
  - 模型配置
  - channels.discord
  - channels.telegram
  - bindings
  - cron/jobs.json
  - 同步 template
  - sync-and-commit
---

# OpenClaw Config Guard（共享技能）

## 目的
在修改 `/home/node/.openclaw` 下配置时，确保：
1) 先改 template（可追踪）
2) 再改运行配置（必要时）
3) 做 diff 审核与反思（必要性/风险/影响）
4) 最后执行 `./sync-and-commit.sh` 提交

该流程用于避免误改、配置漂移、和不可追溯变更。

---

## 适用范围
当任务涉及以下任一内容时，必须使用本技能：
- `/home/node/.openclaw/openclaw.json`
- `/home/node/.openclaw/clawdbot.json`
- `/home/node/.openclaw/cron/jobs.json`
- `/home/node/.openclaw/credentials/*`
- `/home/node/.openclaw/identity/*`
- bot/model/channel/bindings/权限策略相关配置

---

## 标准执行流程（强制）

### Step 0: 变更前快照
```bash
cd /home/node/.openclaw
git status --short
git rev-parse --short HEAD
```

### Step 1: 先改 template 文件
- 先修改 `templates/*.template` 对应文件（而不是先改真实配置）
- 若是新增配置项：
  - 先在 template 中建立结构
  - 敏感值用占位符 `${...}`，不要写明文

### Step 2: 同步到运行配置（如任务要求立即生效）
- 仅在用户明确要求“立即生效”时修改真实配置文件
- 修改真实配置时，严禁把新敏感信息提交到 git

### Step 3: 变更 diff 审核（必须）
执行：
```bash
cd /home/node/.openclaw
git diff -- templates
# 如修改了真实配置（未纳管），额外给出目标文件变更摘要
```

并逐条自检（在回复中简要说明）：
1. **必要性**：每个变更是否为达成目标所必需？
2. **正确性**：字段路径、类型、值域是否正确？
3. **影响面**：会影响哪些 agent/channel/model/bot？
4. **风险**：是否可能导致消息中断、权限丢失、路由错误、任务停摆？
5. **回滚**：是否有明确回滚点（git commit + 旧值说明）？

若上述任一项不确定，先暂停并向用户确认。

### Step 4: 同步并提交（必须）
```bash
cd /home/node/.openclaw
./sync-and-commit.sh
```

预期结果：
- Templates synced successfully
- 有变更时自动 commit（带 UTC 时间戳）并 push
- 无变更时输出 No changes to commit

### Step 5: 生效与验证
若本次修改影响 OpenClaw 主配置行为（如 channels/bindings/models/gateway）：
```bash
openclaw gateway restart
openclaw gateway status
```
并验证关键功能（至少一项）：
- 对应 channel 收发是否正常
- 目标 agent 绑定是否正确
- 相关 cron/功能是否按预期

---

## 输出模板（给用户）

```text
已按 OpenClaw Config Guard 执行：
1) template 已更新：<files>
2) diff 审核结论：
   - 必要性：...
   - 影响面：...
   - 风险：...
   - 回滚：...
3) 已执行 ./sync-and-commit.sh：<成功/无变更>
4) 生效验证：<restart/status/check结果>
```

---

## 禁止事项
- 禁止跳过 template 直接改真实配置并提交
- 禁止提交任何明文 token/apiKey/password/secret
- 禁止在不确定影响时直接重启/覆盖大范围配置

---

## 备注
- 本技能是**共享流程技能**，用于所有 agent 的 OpenClaw 配置改动。
- 关键唤起词：`openclaw配置`、`/home/node/.openclaw`、`sync-and-commit`、`template先改`、`bot/model/channels/bindings`。
