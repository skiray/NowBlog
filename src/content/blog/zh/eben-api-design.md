---
title: "一本账 · API 设计"
description: "REST 接口契约、错误码体系与鉴权方案。"
pubDate: 2026-08-31
tags: ["一本账", "uni-app", "NestJS"]
category: "vibe-coding"
series: "一本账 Eben"
seriesOrder: 6
author: "Skr"
---

| 项目 | 内容 |
|---|---|
| 版本 | v1.1 |
| 状态 | 契约冻结（v1.1 修订后重新冻结，与 04-database-design.md 对齐） |
| 风格 | REST + JSON；OpenAPI 3.0（实现时以 swagger.yml 为准，本文为设计源） |
| 变更记录 | v1.0 首次定稿；v1.1 修订：事务修改/删除路径补 ledger_id、pull 补 ledgers 实体与分页/全量重同步、新增消息模块与全量快照接口、邀请码 join 限流、统计/预算路径与口径、删除失效错误码 40902 |

---

## 1. 通用约定

### 1.1 基础信息

- Base URL：`https://api.eben.app/api/v1`（占位域名，上线前确定）
- 传输：全链路 HTTPS；实时通道 `wss://api.eben.app/ws`
- 编码：UTF-8 JSON；时间戳 ISO 8601（`2025-08-31T12:00:00Z`）；业务日期 `YYYY-MM-DD`
- **金额单位一律为分（整数）**，客户端负责元↔分换算与展示

### 1.2 鉴权

- `Authorization: Bearer <accessToken>`（JWT，2h）
- `refreshToken`（30d）通过刷新接口轮换：`POST /auth/refresh`
- 401 时客户端静默刷新一次后重试原请求；刷新失败则跳转登录
- 无需登录的接口：验证码发送、登录（验证码校验在登录内完成；未注册自动注册，无独立注册接口；其余全部需 JWT）

### 1.3 标准响应包裹

```jsonc
// 成功
{ "code": 0, "data": { /* 业务数据 */ } }
// 失败
{ "code": 40101, "message": "验证码错误或已过期", "request_id": "req_abc123" }
```

### 1.4 错误码规范（5 位：前 3 位≈HTTP，后 2 位序号）

| HTTP | code | 场景 |
|---|---|---|
| 400 | 40001 | 参数校验失败（message 含字段明细） |
| 401 | 40101 | 未登录/token 失效 |
| 401 | 40102 | refreshToken 无效 |
| 403 | 40301 | 非账本成员（防越权核心） |
| 403 | 40302 | 非 owner 权限不足 |
| 404 | 40401 | 资源不存在（不区分"不存在"与"无权查看"，防枚举） |
| 409 | 40901 | 验证码错误/过期 |
| 409 | 40903 | 邀请码无效或已过期 |
| 409 | 40904 | 已是该账本成员 |
| 422 | 42201 | 金额非法（非正整数分/超上限） |
| 429 | 42901 | 触发限流（验证码/接口频次） |
| 500 | 50001 | 服务器内部错误 |

### 1.5 分页约定

列表接口统一：`?page=1&page_size=50`（page_size 上限 100）；响应 `data.list` + `data.total` + `data.has_more`。

---

## 2. 认证模块 /auth

### POST /auth/sms-code

发送验证码。60s 内重复发送返回 42901；同手机号日限 10 条。

```jsonc
// 请求
{ "phone": "13800138000", "scene": "login" }   // scene: login | delete_account（登录未注册自动注册，无独立注册场景）
// 响应 data
{ "retry_after": 60 }
```

### POST /auth/login

验证码登录，未注册自动注册（合一入口，降低流失）。

```jsonc
// 请求
{ "phone": "13800138000", "sms_code": "123456" }
// 响应 data
{ "access_token": "...", "refresh_token": "...", "expires_in": 7200, "user": { "id": 1, "phone": "138****8000", "nickname": "用户8000", "avatar_url": null } }
```

### POST /auth/refresh

```jsonc
// 请求 { "refresh_token": "..." } → 响应同 login（轮换：旧 refreshToken 失效）
```

### POST /auth/logout — 登出（token 进黑名单）

### DELETE /auth/account — 注销账号（二次验证码 scene=delete_account；30 天冷静期后清除敏感数据，用户行保留为「前成员」占位，见 04-database-design.md 3.1）

---

## 3. 用户模块 /users

### GET /users/me — 当前用户信息

### PATCH /users/me — 修改昵称/头像

```jsonc
// 请求（均可选）
{ "nickname": "阿明", "avatar_url": "https://oss.../a.jpg" }
```

### POST /users/avatar — 头像直传（返回 OSS 预签名 URL，客户端 PUT 上传）

```jsonc
// 响应 data
{ "upload_url": "https://oss...?sig=...", "avatar_url": "https://oss.../a.jpg" }
```

---

## 4. 账本模块 /ledgers

### GET /ledgers — 我的账本列表（按最近使用排序）

```jsonc
// 响应 data.list[]
{ "id": 42, "name": "我们的家", "cover_color": "#4C7DFF", "owner_user_id": 1,
  "member_count": 3, "version": 1041, "my_role": 1, "last_txn_at": "2025-08-31T08:00:00Z" }
```

### POST /ledgers — 创建账本

```jsonc
// 请求 { "name": "我们的家", "cover_color": "#4C7DFF" }
// 响应：创建者自动成为 owner 成员；返回完整账本对象
```

### PATCH /ledgers/:id — 修改账本（名称/封面；**仅 owner**，与 PRD 成员角色定义对齐）

### DELETE /ledgers/:id — 解散账本（**仅 owner**；二次确认 + 软删除）

### GET /ledgers/:id/members — 成员列表

```jsonc
// 响应 data.list[]
{ "user_id": 2, "nickname": "老婆", "nickname_in_ledger": "老婆", "avatar_url": "...",
  "role": 2, "joined_at": "...", "txn_count_this_month": 45 }
```

### DELETE /ledgers/:id/members/:userId — 移除成员（**仅 owner**；不能移除自己）

### POST /ledgers/:id/members/leave — 主动退出（owner 不能退出，需先转让或解散）

### POST /ledgers/:id/owner — 转让 owner（**仅 owner**；目标须为成员）

---

## 5. 邀请模块 /invitations

### POST /ledgers/:id/invitations — 生成邀请码（owner 或 member 均可发起）

```jsonc
// 响应 data
{ "code": "482913", "expires_at": "2025-09-01T00:00:00Z" }   // 24h 有效，6 位数字
```

### POST /invitations/join — 凭邀请码加入账本

```jsonc
// 请求 { "code": "482913" }
// 响应 data：账本对象 + 我的角色（member）；错误：40903 无效/过期，40904 已是成员
```

---

## 6. 账目模块 /ledgers/:id/transactions

> 以下所有接口经 JWT Guard + LedgerMember Guard（40301 兜底）。

> txn_date 服务端不限制历史范围（客户端「回溯 7 天」仅为交互约束）；修改/删除账目需在线，离线仅支持新增（POST /sync/upload）。

### GET /ledgers/:id/transactions — 流水列表（分页）

```jsonc
// 查询参数：page, page_size, start_date, end_date,
//           member_id(按付款人 payer), payee_id(为谁花，命中 payee_ids 数组), category_id, type(1/2/3)
// 响应 data
{ "list": [ {
    "id": 901, "client_txn_id": "u1-uuid-...", "type": 1, "amount": 3500,   // 35.00 元
    "category": { "id": 11, "name": "餐饮", "icon": "food" },
    "payer": { "user_id": 1, "nickname": "阿明" },
    "payee_ids": [1, 2], "txn_date": "2025-08-31", "note": "午饭",
    "created_by": 1, "updated_by": 1,
    "created_at": "2025-08-31T04:30:00Z", "updated_at": "2025-08-31T04:30:00Z" } ],
  "total": 128, "has_more": true }
```

### POST /ledgers/:id/transactions — 单笔创建（在线场景用；离线批量走 /sync）

```jsonc
// 请求
{ "client_txn_id": "u1-uuid-...", "type": 1, "amount": 3500, "category_id": 11,
  "payer_id": 1, "payee_ids": [1, 2], "txn_date": "2025-08-31", "note": "午饭" }
// 响应：完整账目对象（含服务端 id 与 updated_at）；client_txn_id 重复时返回已存在对象（幂等）
```

### PATCH /ledgers/:id/transactions/:txnId — 修改（仅记账人 created_by 或 owner；需在线）

### DELETE /ledgers/:id/transactions/:txnId — 删除（同上权限；软删除）

> 路径必须携带 ledger_id，服务端在 SQL 层 join 成员表校验（防 ID 遍历，见 03-architecture.md 4.2）；不存在不带 ledger 的裸 txn_id 路由。

---

## 7. 统计模块 /ledgers/:id/statistics

### GET /ledgers/:id/statistics/summary — 月度总览

```jsonc
// 查询参数：period=2025-08
// 响应 data
{ "income": 2500000, "expense": 875000, "net": 1625000,        // 单位：分
  "prev_expense": 920000, "expense_change_pct": -4.9,
  "txn_count": 128, "member_count": 3 }
```

### GET /ledgers/:id/statistics/by-category — 分类占比（type=1 支出默认，按一级分类聚合）

```jsonc
// 响应 data.list[]
{ "category_id": 11, "name": "餐饮", "icon": "food", "amount": 312000, "pct": 35.7, "txn_count": 45 }
```

### GET /ledgers/:id/statistics/by-member — 成员贡献

```jsonc
// 响应 data.list[]
{ "user_id": 1, "nickname": "阿明", "expense_amount": 412000, "expense_pct": 47.1, "txn_count": 61 }
```

### GET /ledgers/:id/statistics/trend — 近 6 月趋势（P1，接口先留）

```jsonc
// 响应 data.list[]
{ "period": "2025-06", "income": 2500000, "expense": 920000 }
```

> 统计接口全部 Redis 缓存 60s；账目变更时主动失效。

> 统计口径：收支统计与预算进度只计入支出（type=1）；转账（type=3）不计入。分类占比按一级分类聚合（二级分类金额归并至父级）。

---

## 8. 预算模块 /ledgers/:id/budgets

### PUT /ledgers/:id/budgets/:period — 设置/更新月度预算（UPSERT）

```jsonc
// 请求 { "amount": 500000 }   // 5000 元 → 500000 分
// 响应：预算对象 { "ledger_id": 42, "period": "2025-09", "amount": 500000, "usage": 87500, "pct": 17.5 }
```

### GET /ledgers/:id/budgets/current — 当前月预算与使用进度

```jsonc
// 响应 data
{ "period": "2025-08", "amount": 500000, "usage": 437500, "pct": 87.5, "alert_level": 1 }  // 0 正常 1 超80% 2 超100%
```

> usage 口径 = 当月 type=1 支出合计。预算提醒：记账入库时实时判断阈值跨越（80%/100%，当日去重）+ 每日 20:00 跑批兜底（见 03-architecture.md 4.1）。

---

## 9. 同步模块 /sync（离线优先核心）

### POST /sync/upload — 批量上传离线账目

```jsonc
// 请求（单批上限 100 条）
{ "ledger_id": 42, "items": [ {
    "client_txn_id": "u1-uuid-...", "type": 1, "amount": 3500, "category_id": 11,
    "payer_id": 1, "payee_ids": [1], "txn_date": "2025-08-30", "note": "地铁",
    "client_created_at": "2025-08-30T22:00:00Z" } ] }
// 响应 data
{ "results": [ { "client_txn_id": "u1-uuid-...", "server_id": 902, "status": "created" } ],
  // status: created | duplicated(幂等命中) | failed + reason
  "ledger_version": 1042 }
```

> 上传仅支持**新增**（MVP 离线不支持编辑/删除，见 03-architecture.md 3.3）；幂等键为 (ledger_id, client_txn_id)，重复上传返回 duplicated 与既有 server_id。

### GET /sync/pull — 增量拉取

```jsonc
// 查询参数：ledger_id, since_version, limit(默认 500，单次返回变更条数上限)
// 响应 data
{ "ledger_version": 1045, "has_more": false, "next_since": 1045,
  "ledgers":      { "upserts": [ /* 账本对象（改名/封面/转让）*/ ], "deletes": [ /* id 数组，含解散 */ ] },
  "transactions": { "upserts": [ /* 完整账目对象数组 */ ], "deletes": [ /* id 数组 */ ] },
  "members":    { "upserts": [], "deletes": [] },
  "budgets":    { "upserts": [], "deletes": [] },
  "categories": { "upserts": [], "deletes": [] } }
```

> 变更数超过 limit 时返回 `has_more=true` 与 `next_since`，客户端循环拉取至追平；since_version 落后超过变更日志保留期（6 个月）或服务端检测到版本缺口时返回 `{ "full_resync": true }`，客户端改走全量快照接口重建本地库。

### GET /ledgers/:id/snapshot — 全量快照（full_resync 专用）

返回账本当前完整数据（账本信息 + 有效成员 + 分类 + 预算 + 未删除账目），结构与 pull 的 upserts 一致（无 deletes 段），分页约定同 pull；仅账本成员可调用。

---

## 10. 消息模块 /notifications

消息中心数据源（UI「消息」tab）。通知类型：`member_joined` / `member_removed` / `budget_alert` / `ledger_dissolved`。

### GET /notifications — 通知列表（分页，时间倒序）

```jsonc
// 响应 data.list[]
{ "id": 12, "type": "budget_alert", "ledger_id": 42, "title": "预算提醒",
  "content": "「我们的家」本月支出已达预算的 80%", "is_read": false, "created_at": "2025-08-31T12:00:00Z" }
```

### POST /notifications/:id/read — 标记已读

### POST /notifications/read-all — 全部已读

---

## 11. WebSocket 协议（wss://.../ws）

```jsonc
// ↑ 客户端 → 服务端
{ "event": "auth",     "data": { "token": "<accessToken>" } }
{ "event": "join_ledger",  "data": { "ledger_id": 42 } }
{ "event": "leave_ledger", "data": { "ledger_id": 42 } }
{ "event": "ping" }                                        // 30s 心跳

// ↓ 服务端 → 客户端
{ "event": "ledger_changed", "data": { "ledger_id": 42, "version": 1045, "scope": "transactions" } }
{ "event": "ledger_member_joined", "data": { "ledger_id": 42, "user": { /* 成员摘要 */ } } }
{ "event": "budget_alert", "data": { "ledger_id": 42, "alert_level": 1, "pct": 87.5 } }
{ "event": "pong" }
```

重连策略：指数退避 1/2/4/…/60s；重连成功后客户端必须触发一次 `GET /sync/pull` 兜底。

---

## 12. 接口级限流（Redis 令牌桶）

| 接口 | 限制 |
|---|---|
| POST /auth/sms-code | 60s/条 · 10 条/日/手机号 |
| POST /invitations/join | 5 次/分钟/用户 + 20 次/日/用户；连续错误 10 次锁定 1 小时（防 6 位邀请码穷举） |
| POST /auth/login | 10 次/小时/手机号；验证码连续错误 5 次先行锁定（先到者生效） |
| POST /sync/upload | 10 次/分钟/用户 |
| 统计接口 | 60 次/分钟/用户（有缓存，实际压力小） |

## 13. 安全清单（实现时逐条勾选）

- [ ] 所有带 `:id` 的账本资源在 SQL 层 join 成员表校验（防 ID 遍历，见 03-architecture.md 4.2）
- [ ] DTO class-validator 白名单校验；amount 正整数分、上限 100_000_000
- [ ] 404 与 403 统一对外不泄露资源是否存在（防枚举）
- [ ] POST /invitations/join 限流 + 连续失败锁定（6 位码仅 10⁶ 空间，必须防穷举）
- [ ] 账目修改/删除路径必须携带 ledger_id 并过成员校验（不存在裸 txn_id 路由）
- [ ] 敏感操作（解散账本/注销/移除成员）服务端二次确认标记 + 审计日志
- [ ] request_id 全链路贯穿日志
