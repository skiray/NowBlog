---
title: "一本账 Eben：项目总览"
description: "多人共享账本 App「一本账」的立项总览：产品定位、技术基线与九份设计文档索引。"
pubDate: 2026-08-31
tags: ["一本账", "uni-app", "NestJS"]
category: "vibe-coding"
series: "一本账 Eben"
seriesOrder: 1
author: "Skr"
---

> 家庭 / 情侣 / 室友的多人共享账本 App —— 一本账，全家用。

## 命名约定

| 项 | 值 |
|---|---|
| App 显示名（中文） | 一本账 |
| 工程名 / 仓库名 / 目录名 | eben |
| Android 包名 | com.eben.app |
| API 域名（占位，上线前确定） | api.eben.app |

> 英文名 Eben 取「一本」谐音，仅用于工程侧（仓库/包名/域名）；用户可见名称一律为「一本账」。

## 项目定位

- **产品形态**：多人共享账本记账 App（iOS + Android，uni-app 跨端框架）
- **核心场景**：家庭日常收支、情侣共同消费、室友合租分摊 —— 邀请成员进同一本账本，所有人记的账实时可见、统一统计
- **MVP 周期**：3 人基线约 18 周（4.5 个月）至双端全量上线；2 人配置顺延约 3 周（见 docs/07-project-plan.md）

## 技术基线（已确认决策）

| 决策项 | 结论 |
|---|---|
| 客户端框架 | uni-app（Vue 3 + Vite + Pinia，CLI 工程） |
| 发布策略 | 先纯 App（iOS + Android），保留未来出微信小程序的可能 |
| 后端 | 自建轻量后端 NestJS + PostgreSQL + Redis |
| 数据同步 | 云端同步（WebSocket 实时推送 + 拉取兜底），离线优先、冲突取 last-write-wins |
| 金额存储 | 全链路整数（分）存储，杜绝浮点误差 |

## 文档索引（docs/）

| 文档 | 说明 | 对应 SDLC 阶段 |
|---|---|---|
| [01-prd.md](docs/01-prd.md) | 产品需求文档（用户画像、功能清单 P0/P1/P2、用户故事） | 需求分析 |
| [02-competitive-analysis.md](docs/02-competitive-analysis.md) | 竞品分析报告（随手记、鲨鱼记账等 5 款） | 需求分析 |
| [03-architecture.md](docs/03-architecture.md) | 架构设计（客户端离线优先/同步协议、后端模块划分） | 设计 |
| [04-database-design.md](docs/04-database-design.md) | 数据库设计（ER 图、表结构、索引、软删除） | 设计 |
| [05-api-design.md](docs/05-api-design.md) | API 设计（REST 接口契约、错误码、鉴权） | 设计 |
| [06-ui-guidelines.md](docs/06-ui-guidelines.md) | UI 规范与页面流程（设计 token、页面清单、关键交互） | 设计 |
| [07-project-plan.md](docs/07-project-plan.md) | 项目计划（里程碑、人力分配、风险登记册） | 开发/管理 |
| [08-test-plan.md](docs/08-test-plan.md) | 测试计划（单元/兼容/并发/安全/内测） | 测试 |
| [09-launch-checklist.md](docs/09-launch-checklist.md) | 上线准备清单（双端审核材料、灰度、回滚） | 发布 |

## 快速导航

- 想了解产品做什么 → [01-prd.md](docs/01-prd.md) 的「MVP 功能范围」章节
- 想评估技术方案 → [03-architecture.md](docs/03-architecture.md) 的「关键技术决策」章节
- 想看排期和风险 → [07-project-plan.md](docs/07-project-plan.md)

## 文档维护约定

- 文档即单一事实源（Single Source of Truth），代码实现与文档冲突时，先改文档评审、再改代码
- 每份文档头部维护版本号与变更记录
- 本目录仅存放文档，不含任何代码
