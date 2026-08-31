---
title: "一本账 · 数据库设计"
description: "PostgreSQL 表结构、ER 关系、索引与软删除策略；金额全链路整数（分）存储。"
pubDate: 2026-08-31
tags: ["一本账", "uni-app", "NestJS"]
category: "vibe-coding"
series: "一本账 Eben"
seriesOrder: 5
author: "Skr"
---

| 项目 | 内容 |
|---|---|
| 版本 | v1.1 |
| 状态 | 已评审 |
| 数据库 | PostgreSQL 15+ |
| 变更记录 | v1.0 首次定稿；v1.1 修订：系统分类唯一约束改部分索引、幂等键改 (ledger_id, client_txn_id)、注销改为保留行+清除敏感数据、phone 列放宽、pull 全量重同步兜底、本地主键定义 |

---

## 1. 全局约定

- **主键**：所有表用 `id BIGINT GENERATED ALWAYS AS IDENTITY`（App 端本地库用 UUID `client_txn_id` 关联，见 03-architecture.md 3.3）
- **金额**：一律 `BIGINT`，单位**分**（如 12.34 元存 1234）；禁止 FLOAT/NUMERIC 小数运算后直存
- **软删除**：`deleted_at TIMESTAMPTZ NULL`，非空即已删除；账目软删除保留 30 天后由定时任务物理清理（PRD：恢复功能 P2，但数据先留）
- **时间**：全部 `TIMESTAMPTZ`（UTC 存储，客户端本地化展示）
- **命名**：表名复数 snake_case；索引 `idx_{表}_{列}`；唯一约束 `uk_{表}_{列}`

## 2. ER 总览

```
users ──< ledger_members >── ledgers ──< transactions >── categories
                                   │        │
                                   ├──< budgets        └── (payer_id → users)
                                   └──< invite_codes(Redis，非表)
                                       (payee_ids → users，JSON 数组)
```

核心关系：

- `ledgers : users = M : N`（通过 ledger_members，含角色）
- `transactions.payee_ids` 记录「为谁花的」（多选，JSON 数组存 user_id，查询用 GIN 索引）

## 3. 表结构明细

### 3.1 users — 用户

| 列 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | BIGINT | PK | |
| phone | VARCHAR(64) | NOT NULL, UNIQUE | 手机号（登录唯一凭证）；列宽 64 为容纳注销改写值，正常值仍为 11 位 |
| nickname | VARCHAR(32) | NOT NULL | 昵称（默认「用户+手机尾号」） |
| avatar_url | VARCHAR(255) | NULL | OSS 地址 |
| status | SMALLINT | NOT NULL DEFAULT 1 | 1 正常 / 0 已注销 |
| created_at / updated_at | TIMESTAMPTZ | NOT NULL | |

索引：`uk_users_phone`；注销时 phone 改写为 `deleted_{id}_{phone}`（释放手机号；列宽 64 容纳改写值）。**注销不物理删除用户行**：status=0，30 天冷静期满后清除昵称/头像等敏感数据，行保留为「前成员」占位，供 transactions.payer_id / created_by / payee_ids 引用与展示。

### 3.2 ledgers — 账本

| 列 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | BIGINT | PK | |
| name | VARCHAR(32) | NOT NULL | 账本名 |
| cover_color | VARCHAR(16) | NOT NULL DEFAULT '#4C7DFF' | 封面色（MVP 不用图片） |
| owner_user_id | BIGINT | NOT NULL, FK→users.id | 创建者（转让时变更） |
| currency | VARCHAR(8) | NOT NULL DEFAULT 'CNY' | 预留多币种 |
| version | BIGINT | NOT NULL DEFAULT 0 | 同步版本号（详见 3.6） |
| deleted_at | TIMESTAMPTZ | NULL | 解散=软删除 |
| created_at / updated_at | TIMESTAMPTZ | NOT NULL | |

### 3.3 ledger_members — 账本成员（权限核心表）

| 列 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | BIGINT | PK | |
| ledger_id | BIGINT | NOT NULL, FK→ledgers.id | |
| user_id | BIGINT | NOT NULL, FK→users.id | |
| role | SMALLINT | NOT NULL DEFAULT 2 | 1 owner / 2 member |
| nickname_in_ledger | VARCHAR(32) | NULL | 账本内备注名（如「老公」） |
| joined_at | TIMESTAMPTZ | NOT NULL | |
| left_at | TIMESTAMPTZ | NULL | 被移除/退出时间；非空=不再是成员 |

约束与索引：
- `uk_ledger_members_active (ledger_id, user_id) WHERE left_at IS NULL` —— **部分唯一索引**：一个用户在同一账本最多一条有效成员记录（历史记录可多条）
- `idx_ledger_members_user (user_id) WHERE left_at IS NULL` —— 查「我加入的账本列表」
- **鉴权规则**（后端 Guard 统一实现）：`left_at IS NULL` 才视为成员；被移除成员的账目保留（见 3.4 created_by）

### 3.4 transactions — 账目（最核心表）

| 列 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | BIGINT | PK | |
| client_txn_id | UUID | NOT NULL | 客户端生成，幂等去重键 |
| ledger_id | BIGINT | NOT NULL, FK→ledgers.id | 所属账本 |
| type | SMALLINT | NOT NULL | 1 支出 / 2 收入 / 3 转账 |
| amount | BIGINT | NOT NULL, CHECK (amount > 0) | 金额，**分**；CHECK 上限 100_000_000（100 万） |
| category_id | BIGINT | NOT NULL, FK→categories.id | 分类（转账类型指向系统「转账」分类） |
| payer_id | BIGINT | NOT NULL, FK→users.id | 谁付的钱 |
| payee_ids | JSONB | NOT NULL DEFAULT '[]' | 为谁花的，user_id 数组；转账类型时为 [对方成员] |
| txn_date | DATE | NOT NULL | 记账日期（业务日期，非发生时间） |
| note | VARCHAR(200) | NULL | 备注 |
| created_by | BIGINT | NOT NULL, FK→users.id | 记账人（可能与 payer 不同） |
| updated_by | BIGINT | NULL | 最后编辑人 |
| deleted_at | TIMESTAMPTZ | NULL | 软删除 |
| created_at / updated_at | TIMESTAMPTZ | NOT NULL | updated_at 为服务器时间（LWW 依据） |

索引：
- `uk_transactions_client_txn (ledger_id, client_txn_id)` —— 同步幂等（作用域限定账本内）
- `idx_transactions_ledger_date (ledger_id, txn_date DESC) WHERE deleted_at IS NULL` —— 流水列表主查询
- `idx_transactions_ledger_updated (ledger_id, updated_at DESC) WHERE deleted_at IS NULL` —— 增量同步拉取
- `GIN idx_transactions_payee (payee_ids)` —— 按「为谁花」筛选

### 3.5 categories — 分类

| 列 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | BIGINT | PK | |
| ledger_id | BIGINT | NULL, FK→ledgers.id | **NULL = 系统内置分类（全局共享）** |
| name | VARCHAR(16) | NOT NULL | 分类名 |
| icon | VARCHAR(64) | NOT NULL | 图标标识（客户端静态资源 key） |
| parent_id | BIGINT | NULL, FK→categories.id | 二级分类父级 |
| type | SMALLINT | NOT NULL | 1 支出 / 2 收入 / 3 转账 |
| sort_order | SMALLINT | NOT NULL DEFAULT 0 | 排序 |
| is_active | BOOLEAN | NOT NULL DEFAULT true | 逻辑停用（不物理删） |
| created_at / updated_at | TIMESTAMPTZ | NOT NULL | |

约束（PostgreSQL 的 UNIQUE 对 NULL 不判重，必须拆为部分唯一索引）：
- `uk_categories_custom_name (ledger_id, name, type) WHERE ledger_id IS NOT NULL` —— 账本自定义分类唯一
- `uk_categories_system_name (name, type) WHERE ledger_id IS NULL` —— 系统内置分类唯一

**内置分类种子数据**（seed 脚本初始化，参考市场成熟体系）：

- 支出：餐饮（三餐/零食/外卖）、交通（公交/打车/加油）、购物（日用品/服饰/数码）、居住（房贷房租/水电物业/装修）、娱乐（视频会员/游戏/旅行）、医疗、教育、人情（红包/礼物）、通讯、宠物、其他
- 收入：工资、奖金、兼职、理财、红包、报销、其他
- 转账：转账（系统固定）

### 3.6 budgets — 预算

| 列 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | BIGINT | PK | |
| ledger_id | BIGINT | NOT NULL, FK→ledgers.id | |
| period | CHAR(7) | NOT NULL | 预算月份 'YYYY-MM' |
| amount | BIGINT | NOT NULL, CHECK (amount > 0) | 预算总额，分 |
| created_by | BIGINT | NOT NULL, FK→users.id | |
| created_at / updated_at | TIMESTAMPTZ | NOT NULL | |

约束：`uk_budgets_ledger_period (ledger_id, period)` —— 每账本每月一条总预算（MVP 无分类预算）。

## 4. 同步与版本号设计

- `ledgers.version`：该账本**数据版本号**，任何账目/成员/预算变更时 `version += 1`（单行 UPDATE，天然串行化）
- 客户端本地记录 `last_synced_version`；`GET /sync/pull?since=<version>` 返回所有 `变更记录 version > since` 的实体
- WebSocket `ledger_changed` 事件携带最新 version，客户端比对后决定是否拉取
- **变更日志表 ledger_changes（服务端内部表，不开放 API）**：

| 列 | 类型 | 说明 |
|---|---|---|
| id | BIGINT | PK |
| ledger_id | BIGINT | FK |
| version | BIGINT | NOT NULL，`uk(ledger_id, version)` |
| entity_type | SMALLINT | 1 transaction / 2 member / 3 budget / 4 ledger |
| entity_id | BIGINT | 变更实体 id |
| op | SMALLINT | 1 upsert / 2 soft_delete |
| actor_user_id | BIGINT | 操作者 |
| created_at | TIMESTAMPTZ | |

> 设计说明：MVP 用「变更日志 + 实体当前态」双轨（拉取时按 entity_type 回查当前态返回），避免维护完整事件溯源的复杂度。该表按月分区，保留 6 个月。

> 兜底：客户端 since_version 落后超过变更保留期（6 个月）或服务端检测到版本缺口时，pull 返回 full_resync 信号，客户端改走全量快照接口重建本地库（见 05-api-design.md §9）。

## 5. 关键查询示例（性能预演）

```sql
-- 1) 账本流水首页（分页 50 条，日分组）
SELECT t.*, u.nickname FROM transactions t
JOIN ledger_members lm ON lm.ledger_id = t.ledger_id AND lm.user_id = $1 AND lm.left_at IS NULL
JOIN users u ON u.id = t.payer_id
WHERE t.ledger_id = $2 AND t.deleted_at IS NULL
ORDER BY t.txn_date DESC, t.id DESC LIMIT 50 OFFSET $3;
-- 命中 idx_transactions_ledger_date；join 成员表是防越权的 SQL 层兜底

-- 2) 月度分类聚合（统计页）
SELECT c.id, c.name, SUM(t.amount) AS total
FROM transactions t JOIN categories c ON c.id = t.category_id
WHERE t.ledger_id = $1 AND t.type = 1 AND t.deleted_at IS NULL
  AND t.txn_date BETWEEN $2 AND $3
GROUP BY c.id ORDER BY total DESC;
-- 账目 < 10 万级别单账本，走 ledger_date 索引聚合即可；Redis 缓存 60s

-- 3) 增量同步
SELECT * FROM ledger_changes WHERE ledger_id = $1 AND version > $2 ORDER BY version;
-- 命中 uk(ledger_id, version)
```

## 6. 数据量与容量预估

| 表 | 3 个月预估（1 万注册 / 3 千活跃账本） | 1 年预估 | 备注 |
|---|---|---|---|
| transactions | ~200 万行 | ~800 万行 | 单表无压力；账目表按年分区预留（1 年后再评估） |
| ledger_changes | ~250 万行 | ~1000 万行 | 按月分区 + 6 个月保留 |
| users / ledgers / members | 万级 | 十万级 | 无压力 |

**结论**：MVP 阶段单实例 PostgreSQL（4C8G）绰绰有余，无需分库分表。

## 7. 客户端本地库（App 端 SQLite）

与云端表对齐，但增加同步专用列：

| 附加列 | 类型 | 说明 |
|---|---|---|
| sync_status | SMALLINT | 0 pending / 1 synced / 2 failed |
| last_error | TEXT | 失败原因（调试用） |

本地表：transactions（同 3.4 附加同步列）、ledgers、categories（缓存快照）、members（缓存）。**离线创建的记录以 client_txn_id 作为本地主键，同步成功后补写 server_id 建立映射。原则：本地库是显示数据源，云端是事实源；冲突时以服务器 updated_at 较新者为准（LWW，仅在线编辑场景）。**

## 8. 迁移与种子

- 迁移工具：TypeORM Migration（或 Knex），迁移文件入 Git，禁止手工改库
- 种子数据：系统内置分类（3.5）、演示账本（注册引导可选）
- 环境：dev/staging/prod 三套独立库；prod 迁移必须先在 staging 演练
