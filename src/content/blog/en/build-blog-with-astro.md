---
title: "Build a personal blog with Astro"
description: "From zero, use Astro's content collections and static generation to build a blazing-fast personal blog."
pubDate: 2026-01-12
tags: ["astro", "engineering"]
author: "Skr"
category: "tech-talk"
---

Picking a framework for a personal blog, I went back and forth and finally settled on **Astro** — for one simple reason: it ships zero JavaScript to the browser by default.

## Content collections are the key

Astro's Content Collections turn Markdown into real, typed data:

```ts
const posts = await getCollection("blog");
```

Every post's `title`, `pubDate`, `tags` are constrained by a schema, so a typo in the frontmatter fails at build time instead of silently breaking in production.

## Why it's fast

- Pages are already complete HTML at build time
- Only the parts that need interactivity hydrate (Astro calls them "islands")
- Deploy to any static host — no server to maintain

For one person writing posts, this combination is almost perfect.
