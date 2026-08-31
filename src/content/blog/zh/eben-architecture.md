---
title: "一本账 · 架构设计"
description: "uni-app 离线优先客户端 + NestJS 后端：同步协议、模块划分与关键技术决策。"
pubDate: 2026-08-31
tags: ["一本账", "uni-app", "NestJS"]
category: "vibe-coding"
series: "一本账 Eben"
seriesOrder: 4
author: "Skr"
---

| 项目 | 内容 |
|---|---|
| 版本 | v1.1 |
| 状态 | 已评审 |
| 变更记录 | v1.0 首次定稿；v1.1 修订：tabbar 补消息页、离线范围限定为仅新增、幂等键作用域 (ledger_id, client_txn_id)、预算提醒改实时判断、NotifyModule 契约化、Redis 持久化说明 |

---

## 1. 架构总览

```
┌─────────────────────────────────────────────────────────┐
│                     客户端（uni-app App）                 │
│  Vue3 + Vite + Pinia + uv-ui + uCharts                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  页面层 Pages │  │ 本地存储 SQLite │  │  同步引擎 Sync │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└───────────────┬──────────────────────────┬───────────────┘
                │ HTTPS (REST)             │ WSS (WebSocket)
┌───────────────▼──────────────────────────▼───────────────┐
│                    后端（NestJS 单体）                     │
│  Auth │ Ledger │ Transaction │ Statistics │ Budget │ Sync │
│  Guards(成员鉴权) │ WebSocket Gateway │ 定时任务(预算提醒)    │
└───────┬──────────────┬───────────────┬───────────────────┘
        │              │               │
┌───────▼─────┐ ┌──────▼──────┐ ┌──────▼──────┐
│ PostgreSQL  │ │    Redis    │ │ OSS/COS     │
│ (主数据)     │ │ (会话/验证码/ │ │ (头像等对象) │
│             │ │  pub/sub)   │ │             │
└─────────────┘ └─────────────┘ └─────────────┘
```

**架构风格**：NestJS 模块化单体（不做微服务）。2-4 人团队维护单体 + 清晰模块边界，后期可按模块拆分。**金额全链路整数（分），接口层用 `amount: number`（分）传递，禁止浮点运算后存储。**

## 2. 关键技术决策（ADR 摘要）

| # | 决策 | 理由 | 备选与放弃原因 |
|---|---|---|---|
| 1 | uni-app CLI 工程（非 HBuilderX 创建） | 走 VS Code + Git 标准工具链，打包才用 HBuilderX/云打包 | 纯 Flutter：团队 Vue 背景下效率低 |
| 2 | 离线优先（Offline-First） | 记账动作零等待；地铁/弱网可用 | 在线优先：体验差，弱网场景记账失败不可接受 |
| 3 | 同步冲突取 last-write-wins（记录级） | 多人同时记不同账目是常态（天然无冲突），同一条目的并发编辑罕见 | OT/CRDT：复杂度对小团队不划算，MVP 不做 |
| 4 | REST + OpenAPI 契约先行 | 前后端按契约并行开发，联调成本低 | GraphQL：单人后端维护成本高 |
| 5 | WebSocket 仅做「通知触发」 | 推送只发轻量事件（ledger_id + 版本号），数据靠 REST 拉取 | WebSocket 全双工同步协议：复杂且断线重连状态机难维护 |
| 6 | 自建 NestJS 后端 | 多人账本权限逻辑完全可控；国内部署稳定 | Supabase：国内访问与定制受限 |
| 7 | 服务器 Docker Compose 部署 | 运维简单，回滚=切镜像 | K8s：2-4 人团队运维负担过重 |

## 3. 客户端架构（uni-app）

### 3.1 工程结构

```
src/
├── pages/            # 页面（tabbar：流水/统计/消息/我的 + 记账模态页）
├── components/       # 组件（AmountKeyboard 自定义数字键盘等）
├── stores/           # Pinia：auth / ledger / transaction / sync
├── api/              # REST 客户端（按 05-api-design.md 契约生成/手写）
├── services/sync/    # 同步引擎（核心模块，见 3.3）
├── utils/            # money.ts（整数分格式化）、date.ts 等
└── static/           # 分类图标等静态资源
```

### 3.2 性能设计（WebView 渲染的主要风险对冲）

| 风险点 | 对策 | 验证节点 |
|---|---|---|
| 账单长列表卡顿 | 列表虚拟滚动（只渲染可视区 ± buffer）；分页 50 条/页 | **第 1 周技术验证 Demo：低端安卓真机 500+ 条滚动** |
| 自定义数字键盘跟手性 | 纯 Vue 组件实现（touch 事件 + 禁用双击缩放）；若帧率不达标，记一笔页改 nvue 原生渲染 | 与列表同批验证 |
| 首屏慢 | 首页流水从本地 SQLite 直出，网络数据后台刷新 | 联调期埋点验证 |
| 图片内存 | 头像压缩上传（客户端裁剪至 200px） | 开发规范约定 |

**技术验证 Demo（第 1 周，Go/No-Go 节点）**：长列表 + 键盘 + SQLite 三个技术点各做一个最小 Demo，在目标最低端机型（如 2GB RAM 安卓）验证。不达标 → 记一笔页改 nvue / 列表加原生插件，**不推迟到联调期才暴露**。

### 3.3 同步引擎（客户端核心）

```
记账动作 ──► 写本地 SQLite（status=pending）──► UI 立即显示（乐观更新）
                    │
                    ▼ 联网时
             同步队列按序 POST /sync/upload（幂等：client_txn_id 去重）
                    │ 成功
                    ▼
             本地 status=synced ──► WebSocket 收到他人变更事件
                    │                        │
                    ▼                        ▼
             清理已同步数据窗口        GET /sync/pull?since=version
                                          │
                                          ▼
                                   增量写入本地 SQLite
```

- **本地库**：App 端用 plus.sqlite（表结构与云端对齐）；小程序端（未来）降级为 storage 分片
- **幂等性**：每笔账目生成 UUID `client_txn_id`，服务端按 (ledger_id, client_txn_id) 唯一索引去重，重试不重复入账
- **冲突**：MVP 离线仅支持记新账（编辑/删除需在线），LWW 仅用于在线并发编辑：同一笔账目后到达服务器者覆盖（按 `updated_at` 服务器时间戳）
- **同步状态可视化**：列表角标（已同步 ✓ / 同步中 / 失败可点击重试），失败数据永不丢弃

## 4. 后端架构（NestJS）

### 4.1 模块划分

| 模块 | 职责 | 关键点 |
|---|---|---|
| AuthModule | 手机号+验证码登录、JWT 签发/刷新、注销 | 验证码存 Redis（5 分钟有效，60s 冷却，日限 10 条） |
| LedgerModule | 账本 CRUD、邀请码生成/校验、成员管理与角色 | 邀请码 6 位数字，Redis 记录 ledger_id + 过期（24h） |
| TransactionModule | 账目 CRUD、批量上传（同步接口）、软删除 | 所有写操作过 LedgerMemberGuard 成员鉴权 |
| StatisticsModule | 聚合查询（月总览/分类占比/成员贡献/趋势） | SQL 聚合 + Redis 60s 缓存；金额聚合用 SUM(整数分) |
| BudgetModule | 预算 CRUD、超支检测 | 记账入库时实时判断阈值跨越（80%/100%，当日去重）；每日 20:00 跑批兜底；在线成员 WS 推送，离线进消息中心 |
| SyncGateway | WebSocket 网关：账本房间订阅、变更事件广播 | Redis pub/sub 支撑未来多实例 |
| NotifyModule | App 内通知（成员加入/移除、预算提醒、账本解散） | 通知列表 REST 接口（分页/已读）+ WS 推送触发刷新；MVP 不接厂商推送通道 |

### 4.2 鉴权与权限模型

```
请求 → JWT Guard（用户身份）→ LedgerMember Guard（账本成员校验）
     → Role Guard（owner 才能：移除成员/解散/转让）
```

**防越权核心**：所有账本数据查询必须带 `ledger_id` 并在 SQL 层 join 成员表过滤，禁止仅凭 txn_id 查询（防 ID 遍历攻击 —— 测试计划专项覆盖）。

### 4.3 WebSocket 协议（轻量通知型）

```jsonc
// 客户端 → 服务端：加入/离开账本房间
{ "event": "join_ledger", "data": { "ledger_id": 42 } }
// 服务端 → 客户端：账本内任何账目/成员变更
{ "event": "ledger_changed", "data": { "ledger_id": 42, "version": 1041, "scope": "transactions" } }
// 客户端收到后调用 REST 拉取增量（since=本地 version）
```

断线重连：指数退避（1s/2s/4s…max 60s），重连成功即触发一次 pull 兜底。

## 5. 基础设施与部署

| 项 | 方案 |
|---|---|
| 环境 | dev（本地 docker compose）/ staging / prod 三套，staging 与 prod 同构 |
| 部署 | 云服务器 2 台（4C8G）：应用 + 数据库分离；Docker Compose；Nginx 反代 + HTTPS（Let's Encrypt） |
| CI/CD | GitHub Actions：后端跑测试→构建镜像→SSH 部署；客户端构建 wgt/整包（手动触发上架） |
| 备份 | PostgreSQL 每日全量自动备份（保留 30 天），每周恢复演练 |
| 监控 | Sentry（客户端崩溃）+ 云监控（服务器/DB 指标）+ 结构化日志（同步失败率、API P95） |
| Redis | 承载验证码/会话/pub-sub；开启 RDB 持久化；MVP 单实例（宕机重启恢复，验证码可重发，损失可容忍；多实例扩展见第 7 节） |
| 日志规范 | 每请求带 request_id 贯穿；金额相关操作全部留审计日志 |

## 6. 安全设计要点

1. **传输**：全链路 HTTPS/WSS；证书自动续期
2. **鉴权**：JWT 短期 accessToken + refreshToken 轮换；登出即失效（Redis 黑名单）
3. **越权防护**：见 4.2，集成测试必须覆盖「非成员访问账本数据」负向用例
4. **输入校验**：所有 DTO 用 class-validator 白名单校验；金额必须为正整数（分），上限单笔 100 万
5. **限流**：登录/验证码/同步上传接口按用户维度限流（Redis 令牌桶）
6. **数据**：不收集银行卡号等明文敏感信息；手机号仅用于登录，展示时脱敏

## 7. 未来扩展预留（MVP 不实现，仅不封死）

- **微信小程序端**：uni-app 条件编译复用业务代码；本地存储层已抽象接口（SQLite/storage 双实现）
- **多实例横向扩展**：WebSocket 已走 Redis pub/sub，应用无状态化后可直接加实例
- **厂商推送**：NotifyModule 预留 provider 接口，V1.1 接入华为/小米/APNs
- **数据导出**：TransactionModule 预留导出查询接口位
