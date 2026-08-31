---
title: "我的写作工具链"
description: "从灵感捕获到发布，我是如何把写作流程自动化的。"
pubDate: 2026-04-09
tags: ["product", "engineering"]
author: "Skr"
category: "musings"
---

写作最难的从来不是写，而是**开始写**和**别丢稿**。我的链路很朴素：

- 灵感来了，先丢进手机的纯文本备忘录
- 周末统一整理成 Markdown，放进博客仓库的 `src/content/blog/`
- 推送到 Git，CI 自动构建并发布

全程没有数据库、没有后台，文件即真理。坏处是不能在手机上富文本排版，好处是十年后这些 `.md` 还能打开。

> 工具越轻，越容易坚持。
