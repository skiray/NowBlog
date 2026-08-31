# AGENTS.md

Astro 5 static site (零 JS 默认). Commands: `npm run dev` (localhost:4321), `npm run build`, `npm run preview`. There is **no** lint / typecheck / test script — do not look for or invent them.

Project: 中文「今时录」/ 英文「NowBlog」；标语「记录此刻，留存当下」。Directory: `now-blog`.

## Build & verification

- `npm run build` runs `astro build && pagefind --site dist`. Pagefind search index is generated **only** at build time.
- Search, syntax highlighting, archive, lightbox, etc. are **non-functional in `dev`** — verify them via `npm run build && npm run preview`, never `dev`.
- Search (`/search`, `/en/search`) shows a placeholder in dev.

## Search indexing (Pagefind)

- Only the article body is indexed: `PostView.astro` wraps `<Content />` in `<div class="prose" data-pagefind-body>`. Title/description/author (as `data-pagefind-meta`) and tags + category (as `data-pagefind-filter`) are indexed from the header region **outside** that div — they work because Pagefind captures meta/filter anywhere on the page.
- Results are per-locale: `/search` queries zh index, `/en/search` queries en index.
- No other `data-pagefind-meta`/`data-pagefind-filter`; list/archive/tag/category/home pages are excluded via `pagefind-ignore` (Layout default `indexable=false`).

## i18n / content

- Default locale `zh` has **no** URL prefix; English lives under `/en`. Config in `astro.config.mjs` (`prefixDefaultLocale: false`).
- Blog posts live in `src/content/blog/zh/` and `src/content/blog/en/`. Each post needs **two** files with the **same slug**; mismatched slugs break language switching. Schema in `src/content/config.ts` includes optional `cover` (image path under `public/`), optional `draft` (boolean), and optional `category` (a category **id** from `src/data/categories.ts`).
- UI strings (incl. long `about.bio` HTML and `brand`): `src/i18n/ui.ts`. Blog helpers (filter/sort/paginate/archive/related/reading time): `src/i18n/content.ts`. Per-locale RSS: `src/i18n/rss.ts` → `/rss.xml`, `/en/rss.xml`.
- Classification model: categories are defined in `src/data/categories.ts` (`id` + zh/en labels; append there to add one). Current categories: `vibe-coding` / `app` / `bookkeeping` / `tech-talk`. Frontmatter `category` references an id — an unregistered id **fails the build**. URLs use the id (`/categories/vibe-coding/`), pages display the localized label, so language switching works on category pages. One category per post; `tags` = fine-grained labels (`/tags/`); `series` + `seriesOrder` = ordered docs inside one project. zh/en UI keys (`cats.*`, `nav.categories`, `post.category`) must stay in sync in `ui.ts`.
- `draft: true` or future `pubDate` → excluded in `build`, kept in `dev` (see `getPosts`).

## Reading-experience features (article pages only)

All client JS is scoped to `PostView.astro` and degrades gracefully:
- Reading progress bar: pure CSS `animation-timeline: scroll()` (zero JS).
- TOC from `render(post).headings` (h2/h3) with IntersectionObserver scroll-spy; heading anchor links copy URL.
- Copy button on `.prose pre`; back-to-top button; image lightbox.
- Code highlighting: Shiki `themes: { light: "github-light", dark: "github-dark" }` (astro.config.mjs); dark palette applied via `html[data-theme="dark"] .astro-code` rule in `global.css`.
- About `mailto` button lives in `About.astro` (not Hero).

## Fonts (self-hosted, no CDN)

Imported via Fontsource in `Layout.astro` frontmatter: `@fontsource/noto-serif-sc` (Chinese serif tagline) + `@fontsource/tangerine` (English script). Hero tagline styled in `Hero.astro` `.lead` (gradient text). CJK ships as on-demand slices, so only used glyphs download.

## Pre-deploy (repo-specific gotchas)

- Change `site` in `astro.config.mjs` to the real domain — RSS/sitemap URLs depend on it.
- Update domain in `public/robots.txt` (still `https://example.com`).
- Replace identity: `brand` + `about.bio` in `src/i18n/ui.ts`, `SITE_TITLE/SITE_BRAND/SITE_DESCRIPTION` in `src/consts.ts`, `Hero.astro` avatar initials, and post `author` frontmatter.
- Replace `mailto:666@qq.com` in `About.astro`.
- Giscus comments off by default. Enable by filling `GISCUS` in `src/components/Giscus.astro` (remove the `your-` prefixes).

## Conventions

- Styles/design tokens: `src/styles/global.css`. Layout skeleton + theme + SEO + font links: `src/layouts/Layout.astro`.
- Theme toggle is system-aware with persisted choice and anti-flash handling; keep intact when editing `<head>`.
- Deploy outputs `dist/`. Hosts (Vercel/Netlify/Cloudflare Pages/GitHub Pages) just need build `npm run build` + dir `dist/`.
