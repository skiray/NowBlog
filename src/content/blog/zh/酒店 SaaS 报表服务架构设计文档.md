---
title: 酒店 SaaS 报表服务架构设计文档
description: 记录酒店 SaaS 系统下报表服务的架构设计讨论过程，包含技术选型、数据流转与架构方案。
pubDate: 2026-08-24
tags:
  - architecture
  - saas
  - engineering
  - 系统设计
author: Skr
category: "tech-talk"
draft: true
---

# 酒店 SaaS 报表服务架构设计文档
本文档记录了酒店 SaaS 系统下报表服务的架构设计讨论过程，包含技术选型、数据流转、架构图等完整方案。

---

## 一、讨论背景
在酒店 SaaS 系统背景下，需要设计一个**报表服务**，覆盖运营报表、财务报表和管理看板三类场景。本文档通过多轮讨论，确定了完整的技术选型和服务数据流转架构。

---

## 二、架构决策讨论过程
### 问题 1：报表服务的业务定位与边界
在酒店 SaaS 系统中，"报表服务"可以覆盖很广的范围。常见定位有以下几种：

| **定位** | **典型场景** | **数据特点** |
| --- | --- | --- |
| **A. 运营报表** | 每日入住率、房态、RevPAR、ADR | 实时性要求中，数据量中 |
| **B. 财务报表** | 营收汇总、账单明细、对账 | 准确性要求极高，需要历史快照 |
| **C. 管理看板(BI)** | 多门店对比、趋势分析、KPI | 海量历史数据，聚合查询为主 |
| **D. 合规/导出报表** | 税务申报、公安上报、格式化导出 | 定时批量、格式严格 |


**决策**：覆盖 **A 运营报表 + B 财务报表 + C 管理看板**。D（合规导出）可作为独立的导出模块挂在报表服务之下。

---

### 问题 2：数据源 —— 报表服务从哪些系统取数？
现有系统状况：

+ 已有 SaaS 系统，数据库是 MySQL
+ 分布式微服务架构
+ 多租户，数据隔离主要靠逻辑租户 ID（tenant_id）
+ 部分表已做分表处理

**决策**：报表服务从现有 MySQL 微服务取数，核心数据源为 PMS（物业管理系统）+ 账务系统，BI 看板还可能需要 CRM 数据。

---

### 问题 3：数据接入策略 —— 报表服务如何从业务 MySQL 获取数据？
可选方案对比：

| **方案** | **机制** | **优点** | **缺点** |
| --- | --- | --- | --- |
| **A. 直查业务库** | 报表服务直接连业务 MySQL 查询 | 零额外成本，数据最新 | 聚合查询拖垮生产库；跨分表难查 |
| **B. 定时批量 ETL** | 定时任务从 MySQL 抽数据写入报表库 | 实现简单，不侵入生产 | 延迟大（小时级）；增量同步复杂 |
| **C. CDC + 流式同步** | 用 Debezium/Canal 监听 MySQL binlog，推到 Kafka，再落到 OLAP 存储 | 准实时（秒级延迟），对业务零侵入 | 架构复杂度高，需维护 Kafka + CDC |
| **D. 事件驱动推送** | 各微服务在业务操作后发事件，报表服务消费 | 解耦，可定制数据结构 | 需改造所有服务，数据一致性难保证 |


**决策**：方案 **C（CDC + 流式同步）**。直查会拖垮生产，批量 ETL 既有压力又延迟大，事件驱动改造成本太高。

---

### 问题 4：消息中间件现状 —— 是否已有 Kafka？
现有系统**暂无消息中间件**（如 Kafka/RocketMQ）。

讨论了 Flink CDC 是否必须依赖 MQ 中间件：

| **方案** | **链路** | **组件数** | **优劣** |
| --- | --- | --- | --- |
| **传统 CDC + Kafka** | MySQL → Canal/Debezium → Kafka → 消费者 → OLAP | 4层 | 多消费者可并行消费、消息回溯，但组件多、运维重 |
| **Flink CDC 直连** | MySQL → Flink CDC → OLAP | 2层 | 架构极简，Flink 内部直接读 binlog，省掉 Canal + Kafka |


#### Flink CDC 直连方案的优势
1. **无需引入 Kafka**：对"暂无中间件"的情况，直接省掉一整个组件层
2. **一站式计算**：Flink CDC 不只是搬运数据，还能在流上做聚合、维度关联、多表合并——对报表服务非常关键
3. **YAML 作业定义**（Flink SQL CDC）：写几行 SQL 就能完成"读 MySQL binlog → 转换 → 写入 OLAP"
4. **Exactly-Once 语义**：保证报表数据的精确性

#### 加 Kafka 的潜在优势
1. 多消费者复用
2. 故障缓冲（OLAP 宕机时不丢数据）
3. 重算/回溯能力
4. 解耦

**决策**：**第一阶段先用 Flink CDC 直连方案上线，架构上预留 Kafka 接入点**。当第二个消费者出现时，再引入 Kafka。暂不引入 Kafka。

---

### 问题 5：OLAP 存储层选型
核心候选：

| **OLAP 引擎** | **适合场景** | **特点** |
| --- | --- | --- |
| **StarRocks / Doris** | 实时报表 + BI 查询 | 支持 Flink CDC 直接写入，查询快，MySQL 协议兼容 |
| **ClickHouse** | 超大数据量 BI 分析 | 单表查询极快，但 JOIN 弱 |
| **Doris** | 中文社区强，运维资料多 | 和 StarRocks 同源 |


**决策**：**Apache Doris**。

---

### 问题 6：Doris 表模型选型 —— 三类报表需要不同的表模型
Doris 有三种核心表模型：

| **表模型** | **特点** | **适合场景** | **对应需求** |
| --- | --- | --- | --- |
| **Duplicate（明细模型）** | 原始数据全量保留，不去重不聚合 | 数据湖角色，保留全量明细做追溯 | 所有数据的底座，先落明细 |
| **Unique（主键模型）** | 按主键 upsert，最新值覆盖旧值 | 需要更新/覆盖的场景 | 财务报表 B（订单状态变更、退款、调账） |
| **Aggregate（聚合模型）** | 按维度自动预聚合，写入时合并 | 高频聚合查询，BI 看板 | 管理看板 C |


**决策**：**分层建模 ODS→DWD→DWS→ADS**，Doris 分区策略为**时间分区 + tenant_id 分桶**。

```plain
Flink CDC →  ODS层（Duplicate明细模型，全量原始数据）
                ↓
          DWD层（Unique模型，订单/账务等可变数据按主键upsert）
                ↓
          DWS层（Aggregate模型，按租户+日期+门店维度预聚合）
                ↓
          ADS层（应用层，直接对接报表查询）
```

---

### 问题 7：报表服务的 API 层架构 —— 如何对接前端？
#### 7a：报表服务技术栈
**决策**：沿用现有微服务技术栈 **Spring Boot 3.5 + JDK 21**。

#### 7b：报表查询模式 —— 三类报表需要不同的服务能力
| **报表类型** | **查询特点** | **服务处理方式** |
| --- | --- | --- |
| **A 运营报表** | 实时性要求中（分钟级），查询简单，秒级返回 | 同步查询：前端请求 → 服务直接查 Doris DWS/ADS → 返回 |
| **B 财务报表** | 数据量大，可能跨多月，查询复杂 | 同步/异步混合：简单查询同步返回，复杂报表走异步生成 |
| **C 管理看板** | 多维聚合，可能秒级~十秒级 | 同步查询 + 缓存：热点看板结果缓存，避免重复计算 |


**决策**：双路径设计 + 引入 Redis 缓存。

```plain
┌─→ 同步查询路径 ──→ Doris DWS/ADS ──→ 返回JSON
前端请求 → 报表服务API ──┤
                        └─→ 异步任务路径 ──→ 任务队列 ──→ 生成报表文件(PDF/Excel) ──→ 下载
```

+ Redis 缓存热点看板结果（TTL 5分钟），兼做异步任务状态存储。

---

### 问题 8：分层之间的转换在哪里做？—— Flink 还是 Doris？
| **方案** | **链路** | **特点** |
| --- | --- | --- |
| **方案 A：Flink 全链路** | MySQL → Flink CDC → Flink 内部做清洗/合并/聚合 → 直接写 Doris 各层 | 全流式实时，但 Flink 作业复杂度高 |
| **方案 B：Flink 只做搬运，Doris 内部做 ETL** | MySQL → Flink CDC → 写入 ODS 层 → Doris 内部 INSERT INTO...SELECT 做层间转换 | Flink 简单，转换逻辑用 Doris SQL |
| **方案 C：混合** | Flink 做 ODS→DWD（实时清洗+分表合并+主键 upsert）→ Doris SQL 做 DWD→DWS（定时聚合） | 实时性和维护性的平衡 |


**决策**：**方案 C（混合）**。

+ Flink 做 ODS→DWD 实时转换（分表合并、字段清洗、upsert）
+ **Spring Boot @Scheduled** 定时触发 Doris SQL 做 DWD→DWS 聚合

---

### 问题 9：异步报表生成机制 + 文件存储
#### 9a：异步任务触发方式（无 Kafka 的替代方案）
| **方案** | **机制** | **优劣** |
| --- | --- | --- |
| **A. Spring @Async 线程池** | 请求进来后开新线程执行，结果写 Redis | 简单，但服务重启会丢失任务 |
| **B. Spring Task + DB 任务表** | 任务状态存 MySQL，@Scheduled 轮询拉起待执行任务 | 可靠，重启不丢，但延迟取决于轮询间隔 |
| **C. Redis Stream + Redisson** | 用 Redis Stream + Redisson 延迟队列 | 比 @Async 可靠，无需额外中间件 |


**决策**：**方案 C（Redis Stream + Redisson）**。

#### 9b：文件存储位置
**决策**：使用**现有云 OSS**。

---

### 问题 10：报表定义模型 —— 硬编码还是元数据驱动？
| **方案** | **机制** | **优劣** |
| --- | --- | --- |
| **A. 硬编码** | 每个报表在 Spring Boot 里写一个 Controller + Service + Mapper | 简单，但每加一个报表都要改代码发版 |
| **B. 元数据驱动** | 报表配置存 DB，运行时动态渲染 | 加报表零代码，但前期建设成本高 |
| **C. 半元数据驱动** | 常用报表硬编码，个性化/自定义报表走元数据配置 | 平衡开发和灵活性 |


**决策**：**方案 C（半元数据驱动）**，并需要**可视化报表配置管理后台**。

#### 元数据驱动的核心数据模型
```plain
report_definition（报表定义表）
├── id, tenant_id, report_name, report_type(A/B/C)
├── data_source（指向哪个Doris表/视图）
├── query_template（SQL模板，带变量占位符如 ${date_range}）
├── dimensions（维度JSON：门店、日期、渠道...）
├── metrics（指标JSON：入住率、RevPAR、营收...）
├── chart_type（柱图/折线/表格/饼图）
├── cache_ttl（缓存时长，秒）
└── is_async（是否异步生成文件）
```

---

### 问题 11：报表权限模型 —— 多租户 + 角色的访问控制
#### 访问者角色
| **角色** | **典型身份** | **可看数据范围** | **典型报表** |
| --- | --- | --- | --- |
| **租户管理员** | 酒店集团 IT/老板 | 本租户所有门店 | 全部 |
| **店长** | 单店负责人 | 仅自己门店 | 运营报表、财务报表 |
| **财务** | 集团财务 | 本租户所有门店财务数据 | 财务报表 |
| **集团总部** | 连锁集团总部 | 旗下多租户 | 跨租户看板 |


#### 权限模型设计
```plain
请求 → 网关(解析JWT, 获取user_id + tenant_id + role) 
     → 报表服务
         → 校验: 用户是否有权限访问该报表(report_id)?
         → 校验: 用户的tenant_id 是否匹配?
         → 校验: 用户的门店权限范围(store_ids)?
         → 拼SQL时强制注入 tenant_id + store_id 过滤条件
         → 查 Doris
```

**决策**：

1. **跨租户场景存在**（集团总部管多个酒店租户），需高权限角色
2. **权限复用现有用户体系**，暂不展开设计
3. **SQL 模板强制注入 tenant_id 过滤**防数据泄漏

#### 关键安全约束
+ SQL 模板引擎必须防注入：用户输入的参数必须走参数化查询
+ Doris 查询日志：记录谁查了什么报表，满足财务审计需求
+ 租户级数据行数校验：定期跑校验作业，对比 Doris 和 MySQL 的 tenant_id 数据行数

---

### 问题 12：Flink 集群部署方式
| **方案** | **部署方式** | **优劣** |
| --- | --- | --- |
| **A. Flink Standalone** | 独立集群，手动管理 Job | 简单，资源固定 |
| **B. Flink on K8s（Native）** | Flink K8s Operator，按需启停 Job | 弹性伸缩，云原生 |
| **C. Flink on YARN** | 依赖 Hadoop 集群 | 引入太重，不推荐 |
| **D. Flink Standalone + SQL Gateway** | Flink 做执行引擎，远程提交作业 | 和 Spring Boot 集成好 |


**决策**：

+ 部署方式：**方案 D（Standalone + SQL Gateway）**
+ 作业开发：**Java DataStream API**（非 SQL）

---

## 三、架构决策汇总
| **#** | **决策点** | **最终选择** |
| --- | --- | --- |
| 1 | 业务范围 | 运营报表 + 财务报表 + BI 看板（A+B+C） |
| 2 | 数据源 | MySQL 微服务，多租户 tenant_id 隔离，部分分表 |
| 3 | 数据接入 | Flink CDC 直连，不引入 Kafka |
| 4 | OLAP 存储 | Apache Doris |
| 5 | Doris 建模 | ODS→DWD→DWS→ADS 分层，时间分区 + tenant_id 分桶 |
| 6 | 报表服务 | Spring Boot 3.5 + JDK 21 |
| 7 | 缓存 | Redis（缓存 + 异步任务状态） |
| 8 | 查询路径 | 同步查 Doris + 异步生成文件双路径 |
| 9 | 层间转换 | Flink 做 ODS→DWD 实时转换；Spring @Scheduled 触发 Doris SQL 做 DWD→DWS 聚合 |
| 10 | 异步任务 | Redis Stream + Redisson |
| 11 | 文件存储 | 现有云 OSS |
| 12 | 报表定义 | 半元数据驱动（常用报表硬编码，自定义报表走配置） |
| 13 | 配置后台 | 需要，可视化报表配置管理 |
| 14 | 跨租户 | 有集团总部跨租户场景，需高权限角色 |
| 15 | 权限 | 复用现有用户体系 |
| 16 | Flink 部署 | Standalone 集群，Java DataStream API |


---

## 四、架构图
```plain
graph TB
    subgraph 业务系统层["🏢 现有酒店 SaaS 业务系统"]
        PMS["PMS 物业管理<br />订单/入住/房态"]
        FIN["账务系统<br />账单/支付/退款"]
        CRM["CRM 会员系统"]
        DB["MySQL<br />多租户 tenant_id<br />部分分表"]
        PMS --> DB
        FIN --> DB
        CRM --> DB
    end

    subgraph 数据同步层["🔄 数据同步层"]
        FLINK["Flink CDC Standalone<br />Java DataStream API<br />分表合并 + 字段清洗 + upsert"]
        DB -.->|"binlog"| FLINK
    end

    subgraph OLAP存储层["📊 Apache Doris"]
        ODS["ODS 层<br />Duplicate 明细模型<br />全量原始数据"]
        DWD["DWD 层<br />Unique 主键模型<br />订单/账务可变数据 upsert"]
        DWS["DWS 层<br />Aggregate 聚合模型<br />租户+日期+门店预聚合"]
        ADS["ADS 层<br />物化视图/应用表<br />对接报表查询"]
        
        FLINK -->|"实时写入"| ODS
        FLINK -->|"实时清洗+upsert"| DWD
        DWD -->|"Spring @Scheduled<br />定时 Doris SQL"| DWS
        DWS --> ADS
    end

    subgraph 报表服务层["🛠️ 报表服务 Spring Boot 3.5 + JDK21"]
        GATEWAY["报表API层"]
        SYNC["同步查询路径<br />拼SQL → 查Doris → 返回JSON"]
        ASYNC["异步任务路径<br />Redis Stream + Redisson"]
        CONFIG["报表配置管理后台<br />元数据驱动"]
        SCHED["@Scheduled 定时任务<br />触发DWS聚合"]
        
        GATEWAY --> SYNC
        GATEWAY --> ASYNC
        GATEWAY --> CONFIG
        SCHED --> DWS
    end

    subgraph 中间件层["🔌 中间件"]
        REDIS["Redis<br />热点看板缓存 + 任务状态"]
        OSS["云 OSS<br />报表文件存储"]
    end

    SYNC -->|"查询"| ADS
    SYNC -->|"缓存"| REDIS
    ASYNC -->|"任务队列"| REDIS
    ASYNC -->|"查询"| DWS
    ASYNC -->|"存文件"| OSS

    subgraph 前端层["📱 前端"]
        WEB["报表前端<br />看板/报表/导出"]
    end

    WEB -->|"HTTP请求"| GATEWAY
    WEB -.->|"下载文件"| OSS

    subgraph 权限层["🔒 安全层"]
        AUTH["现有用户权限体系<br />JWT + tenant_id + role<br />复用现有"]
        GATEWAY -.->|"校验"| AUTH
    end
```

---

## 五、数据流转详解
### 流转 1：实时数据同步链路
```plain
MySQL binlog → Flink CDC (Java DataStream) 
  → 分表合并(UNION) + 字段清洗 + tenant_id 透传
  → 写入 Doris ODS 层 (Duplicate模型，全量保留)
  → 同时写入 Doris DWD 层 (Unique模型，主键upsert保证最新状态)
```

### 流转 2：定时聚合链路
```plain
Spring Boot @Scheduled 定时触发
  → 执行 Doris SQL: INSERT INTO DWS SELECT ... FROM DWD GROUP BY tenant_id, date, store_id
  → DWS 层预聚合结果
  → 物化视图 / ADS 层
```

### 流转 3：同步报表查询链路
```plain
前端请求(带 tenant_id + role + store_ids)
  → 网关校验权限
  → 报表API读取报表配置(半元数据驱动)
  → 拼SQL模板，强制注入 tenant_id + store_id 过滤
  → 先查 Redis 缓存
  → 缓存未命中 → 查 Doris DWS/ADS
  → 写回缓存(TTL 5min)
  → 返回 JSON 给前端渲染
```

### 流转 4：异步报表生成链路
```plain
前端请求(大数据量报表/导出)
  → 报表API 创建异步任务 → 写入 Redis Stream
  → Redisson 消费者拉取任务
  → 查 Doris DWD/DWS 拿明细数据
  → 生成 Excel/PDF 文件
  → 上传到 云OSS
  → 更新任务状态(完成) → Redis 记录文件URL
  → 前端轮询任务状态 → 获取下载链接
```

### 流转 5：跨租户看板链路（集团总部）
```plain
集团总部用户(高权限角色)
  → 网关识别集团管理员角色
  → 报表API 跳过 tenant_id 过滤(或注入多租户ID列表)
  → 查 Doris DWS 跨租户聚合数据
  → 返回多租户对比看板
```

---

## 六、技术栈总览
| **层** | **技术选型** | **版本/说明** |
| --- | --- | --- |
| 数据库 | MySQL | 现有 |
| 数据同步 | Flink CDC | Java DataStream API |
| OLAP | Apache Doris | 最新稳定版 |
| 报表服务 | Spring Boot + JDK | 3.5 + 21 |
| 缓存 | Redis | 现有或新建 |
| 异步队列 | Redis Stream + Redisson | 基于 Redis |
| 文件存储 | 云 OSS | 现有 |
| Flink 部署 | Standalone 集群 | 独立部署 |


---

## 七、Doris 建模设计
| **层** | **表模型** | **用途** | **特点** |
| --- | --- | --- | --- |
| ODS | Duplicate（明细模型） | 全量原始数据底座 | 不去重不聚合，保留全量明细做追溯 |
| DWD | Unique（主键模型） | 订单/账务可变数据 | 按主键 upsert，最新值覆盖旧值，保证财务准确性 |
| DWS | Aggregate（聚合模型） | 预聚合结果 | 按租户+日期+门店维度自动聚合，支撑 BI 查询 |
| ADS | 物化视图/应用表 | 对接报表查询 | 直接对接前端报表页面 |


### 分区与分桶策略
+ **分区**：按时间（日/月）
+ **分桶**：按 tenant_id，租户级查询只扫描对应桶，性能好且天然隔离

---

## 八、报表定义模型
### 元数据驱动核心表结构
```sql
report_definition（报表定义表）
├── id, tenant_id, report_name, report_type(A/B/C)
├── data_source（指向哪个Doris表/视图）
├── query_template（SQL模板，带变量占位符如 ${date_range}）
├── dimensions（维度JSON：门店、日期、渠道...）
├── metrics（指标JSON：入住率、RevPAR、营收...）
├── chart_type（柱图/折线/表格/饼图）
├── cache_ttl（缓存时长，秒）
└── is_async（是否异步生成文件）
```

### 半元数据驱动策略
+ **常用报表**：硬编码（性能好、定制强）
+ **自定义报表**：走 DB 配置（report_definition 表），运营人员通过配置后台可视化管理

---

## 九、安全与权限设计
### 权限模型
+ 复用现有用户权限体系（JWT + tenant_id + role）
+ 报表定义表加 `visible_roles` 字段，标注哪些角色可见
+ 门店范围：用户表有 `managed_store_ids`，查 Doris 时作为额外过滤条件
+ 跨租户场景：集团总部高权限角色，能跨 tenant_id 查询

### 安全约束
1. **SQL 模板引擎必须防注入**：用户输入的参数（日期范围、门店 ID）必须走参数化查询
2. **Doris 查询日志**：记录谁查了什么报表，满足财务审计需求
3. **租户级数据行数校验**：定期跑校验作业，对比 Doris 和 MySQL 的 tenant_id 数据行

