---
title: "用 Astro 搭建个人博客"
description: "从零开始，用 Astro 的内容集合与静态生成，搭建一个快到飞起的个人博客。"
pubDate: 2026-01-12
tags: ["astro", "engineering"]
author: "Skr"
---

做个人博客这件事，我纠结过很多框架，最后停在 **Astro**，原因很简单：它默认不发任何 JavaScript 到浏览器。

## 内容集合是关键

Astro 的 Content Collections 让 Markdown 变成带类型的真·数据：

```ts
const posts = await getCollection("blog");
```

每篇文章的 `title`、`pubDate`、`tags` 都被 schema 约束，写错字段构建期就会报错，而不是上线后悄悄裂开。

## 为什么快

- 页面在构建时就已经是完整 HTML
- 只有需要交互的地方才会 hydrate（Astro 叫 "islands"）
- 部署到任意静态托管，连服务器都不用养

对一个人写写文章来说，这套组合几乎无可挑剔。
