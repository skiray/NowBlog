---
title: "用 Pagefind 做静态站搜索"
description: "纯静态网站也能有丝滑的全文搜索，而且零后端。"
pubDate: 2026-07-02
tags: ["astro", "performance", "engineering"]
author: "Skr"
---

静态站点最大的痛点是搜索：没有服务器，怎么搜？答案可能是 **Pagefind**。

## 原理很聪明

构建完成后，Pagefind 直接扫描生成的 HTML，建立索引，产出一堆静态文件。用户搜索时，索引在浏览器里加载，完全不需要后端。

```bash
npm run build   # astro build && pagefind --site dist
```

## 体验

- 支持中文分词
- 搜索结果高亮命中词
- 构建后开箱即用，dev 模式下自动降级提示

对个人博客来说，这是性价比最高的搜索方案，没有之一。
