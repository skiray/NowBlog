---
title: "Why I default to zero JavaScript"
description: "Sending no client-side script by default buys visible speed and a smaller attack surface."
pubDate: 2026-02-03
tags: ["astro", "performance"]
author: "Skr"
category: "Tech Notes"
---

Most frameworks dump a whole runtime into the browser first, then try to make it not-too-slow. Astro flips it: **zero JS** by default, and you opt in locally when you need it.

## Speed is an experience

Users may not name the difference of a hundred milliseconds, but their body remembers it. A perfect Lighthouse score isn't the goal; instant feels is.

## A smaller attack surface

No always-on client runtime means a lot less surface to attack. For someone lazy about patching, that's peace of mind.

## You can still use JS

When you need comments, search, or charts, you can still drop in React, Vue, or Svelte components — they just live on that one small "island" and don't weigh down the whole page.
