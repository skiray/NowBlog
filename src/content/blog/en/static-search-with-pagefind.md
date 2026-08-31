---
title: "Static-site search with Pagefind"
description: "Even a fully static site can have smooth full-text search, with zero backend."
pubDate: 2026-07-02
tags: ["astro", "performance", "engineering"]
author: "Skr"
category: "tech-notes"
---

The biggest pain of a static site is search: no server, how do you search? The answer might be **Pagefind**.

## Clever idea

After the build, Pagefind scans the generated HTML, builds an index, and emits static files. When a user searches, the index loads in the browser — no backend at all.

```bash
npm run build   # astro build && pagefind --site dist
```

## Experience

- Chinese word segmentation works
- Hit words are highlighted in results
- Works out of the box after build; dev mode shows a friendly fallback

For a personal blog, it's the highest-leverage search option, bar none.
