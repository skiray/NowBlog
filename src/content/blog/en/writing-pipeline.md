---
title: "My writing toolchain"
description: "From capturing an idea to publishing, how I automate the writing flow."
pubDate: 2026-04-09
tags: ["product", "engineering"]
author: "Skr"
category: "musings"
---

The hardest part of writing was never the writing — it's **starting** and **not losing drafts**. My pipeline is plain:

- An idea hits → drop it into a plain-text note on my phone
- Weekends → consolidate into Markdown, into `src/content/blog/`
- Push to Git → CI builds and publishes

No database, no admin panel; files are the source of truth. The downside is no rich editing on mobile, the upside is these `.md` files still open in ten years.

> The lighter the tool, the easier to keep going.
