---
title: "7 habits for frontend performance"
description: "Small, repeatable habits that are easy to do and easy to forget — they add up."
pubDate: 2026-03-18
tags: ["performance", "engineering"]
author: "Skr"
category: "tech-notes"
---

Performance isn't a one-time cleanup before launch; it's a daily habit. Here are the ones I repeat most:

1. **Ask if the image can be smaller** — modern formats, right-sized dimensions
2. **Don't load every font** — `font-display: swap` saves your life
3. **Static when you can** — build-time beats runtime, always
4. **Animate only `transform` and `opacity`** — avoid layout thrash
5. **Lazy-load below-the-fold content**
6. **Delete unused dependencies** — every byte of bundle counts
7. **Measure on a real network, not just localhost**

No silver bullet, but these add up into a noticeably better experience.
