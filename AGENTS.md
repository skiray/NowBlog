# AGENTS.md

Astro 5 static site (零 JS 默认). Commands: `npm run dev` (localhost:4321), `npm run build`, `npm run preview`. There is **no** lint / typecheck / test script — do not look for or invent them.

Project: 中文「今时录」/ 英文「NowBlog」；标语「记录此刻，留存当下」。Directory: `now-blog`.

## Build & verification

- `npm run build` runs `astro build && pagefind --site dist`. Pagefind search index is generated **only** at build time.
- Search, syntax highlighting, archive, lightbox, etc. are **non-functional in `dev`** — verify them via `npm run build && npm run preview`, never `dev`.
- Search (`/search`, `/en/search`) shows a placeholder in dev.

## Search indexing (Pagefind)

- Only the article body is indexed: `PostView.astro` wraps `<Content />` in `<div class="prose" data-pagefind-body>`. Title/description/author (as `data-pagefind-meta`) and tags (as `data-pagefind-filter`) are indexed from the header region **outside** that div — they work because Pagefind captures meta/filter anywhere on the page.
- Results are per-locale: `/search` queries zh index, `/en/search` queries en index.
- No `data-pagefind-meta`/`data-pagefind-filter` elsewhere; list/archive/tag/home pages are excluded via `pagefind-ignore` (Layout default `indexable=false`).

## i18n / content

- Default locale `zh` has **no** URL prefix; English lives under `/en`. Config in `astro.config.mjs` (`prefixDefaultLocale: false`).
- Blog posts live in `src/content/blog/zh/` and `src/content/blog/en/`. Each post needs **two** files with the **same slug**; mismatched slugs break language switching. Schema in `src/content/config.ts` includes optional `cover` (image path under `public/`) and `draft` (boolean).
- UI strings (incl. long `about.bio` HTML and `brand`): `src/i18n/ui.ts`. Blog helpers (filter/sort/paginate/archive/related/reading time): `src/i18n/content.ts`. Per-locale RSS: `src/i18n/rss.ts` → `/rss.xml`, `/en/rss.xml`.
- `draft: true` or future `pubDate` → excluded in `build`, kept in `dev` (see `getPosts`).

## Reading-experience features (article pages only)

All client JS is scoped to `PostView.astro` and degrades gracefully:
- Reading progress bar: pure CSS `animation-timeline: scroll()` (zero JS).
- TOC from `render(post).headings` (h2/h3 only) with IntersectionObserver scroll-spy — the spy observes h2/h3 **only**, because an observed h4 would clear the highlight without ever setting a new one. Copyable anchor links are injected into h1–h4, though only h2/h3 appear in the TOC.
- Back-to-top button; image lightbox. (The code copy button belongs to Expressive Code — see the next section.)
- The `mailto` button lives in `AuthorCard.astro` (not Hero, not About); its address comes from `SITE_EMAIL` in `src/consts.ts`.

## Code blocks (Expressive Code)

Code blocks come from [Expressive Code](https://expressive-code.com/) through the `astro-expressive-code` integration in `astro.config.mjs`. It replaces Astro's built-in Shiki highlighting, so `markdown.shikiConfig` is gone and there is no `.astro-code` element any more.

- Output shape: `<figure class="frame">` → `<figcaption class="header">` (file name) + `<pre>` → `<div class="ec-line">` → `<div class="code">`. Expressive Code applies `all: revert` inside its own subtree, so **do not restyle `pre`/`code` under `.prose`** — only the block's outer margin is ours (`.prose :global(.expressive-code)`).
- Features come from the fence meta string, e.g. ```` ```ts title="src/lib/lru.ts" showLineNumbers {2-4} /term/ ```` for file name, line numbers, line highlighting and text markers. Line numbers require `@expressive-code/plugin-line-numbers`, registered via `plugins: [...]`; without it `showLineNumbers` is silently ignored.
- Line numbers and highlight ranges are **relative to the block**, not to the source file.
- Themes: `themes: ["github-light", "github-dark"]` with `useDarkModeMediaQuery: false` and a `themeCssSelector` mapping onto this site's `html[data-theme="light|dark"]`. `Layout.astro`'s inline script always sets that attribute, so blocks follow the site toggle rather than the OS.
- The copy button (with its `aria-live` announcement) is Expressive Code's own; it adds a ~1 kB `ec.*.js` module to pages that contain code blocks.
- `src/content/blog/{zh,en}/rendering-showcase.md` is a sample post exercising every element — typography, tables, all code-block features, both diagram types, task lists and footnotes. Re-check it after touching the pipeline.

## Mermaid diagrams

Author diagrams with a ```mermaid fence. Two pieces make them work:

- **Build time** — `src/plugins/rehype-mermaid.mjs` (registered as `markdown.rehypePlugins` in `astro.config.mjs`) rewrites the block into `<div class="mermaid" data-pagefind-ignore="all">`, so there is no flash of source code. It must stay registered **before** Expressive Code, so the fence is still a plain `<pre>` when it runs; the plugin reads the language off that `<pre>` (`data-language="mermaid"`), because the `<code>` element carries no `language-*` class.
- **Run time** — `PostView.astro` dynamically imports `mermaid` only when the page contains `.mermaid`. Posts without diagrams never download it (the library is a ~683 kB / ~169 kB gzip lazy chunk). Theme follows `html[data-theme]` and repaints on `theme-change`.

Diagram source is excluded from the Pagefind index via `data-pagefind-ignore`.

**Gotcha:** Astro caches rendered collection content in `node_modules/.astro`, keyed on file contents. After editing *only* the rehype plugin, existing posts will not re-render — `rm -rf node_modules/.astro` (or bump the markdown config) to force it.

## Fonts (self-hosted, no CDN)

Imported via Fontsource in `Layout.astro` frontmatter: `@fontsource/noto-serif-sc` (Chinese serif tagline) + `@fontsource/tangerine` (English script). Hero tagline styled in `Hero.astro` `.lead` (gradient text). CJK ships as on-demand slices, so only used glyphs download.

## Pre-deploy (repo-specific gotchas)

- Change `site` in `astro.config.mjs` **and** the `Sitemap:` line in `public/robots.txt` together (both are currently `https://nowblog.pages.dev`) — RSS/sitemap URLs depend on them.
- Replace identity: `brand` + `about.bio` in `src/i18n/ui.ts`, `SITE_TITLE/SITE_BRAND/SITE_DESCRIPTION/SITE_EMAIL` in `src/consts.ts`, `Hero.astro` / `AuthorCard.astro` avatar initials, and post `author` frontmatter.
- Contact email is centralized in `SITE_EMAIL` (`src/consts.ts`); `AuthorCard.astro` renders it as the `mailto:` button.
- Giscus is **enabled** for `skiray/now-blog`. To change repo/category, edit the `GISCUS` object in `src/components/Giscus.astro`; reverting any value to a `your-` prefix disables it again.

## Legal pages

- `/privacy` + `/terms` (and `/en/privacy`, `/en/terms`) come from `src/pages/[...locale]/{privacy,terms}.astro`, which both render the shared `src/components/LegalPage.astro`.
- Their copy lives in `src/i18n/ui.ts` (`privacy.*` / `terms.*`); the "last updated" date is `LEGAL_UPDATED` in `src/consts.ts`. Bump it whenever the text changes.
- Both inherit `Layout`'s default `indexable=false`, so Pagefind skips them, but they do appear in the sitemap.

## Conventions

- **Astro scoped styles never match runtime-created elements.** Astro appends `[data-astro-cid-*]` to every selector in a component `<style>`, so markup built with `document.createElement` gets no styles at all unless the selector is wrapped in `:global(...)`. This already bit the lightbox overlay, the heading anchors, and the Pagefind result cards on `/search`; keep it in mind for any new client-injected element.
- Markdown body elements (`hr`, `h1`, `h4`…) are rendered by `<Content />`, so they carry no scope attribute either — style them as `.prose :global(tag)`.
- Post bodies should not start with a `# ` H1: the page already renders the title as the only `<h1>`.
- Styles/design tokens: `src/styles/global.css`. Layout skeleton + theme + SEO + font links: `src/layouts/Layout.astro`.
- Theme toggle is system-aware with persisted choice and anti-flash handling; keep intact when editing `<head>`.
- Deploy outputs `dist/`. Hosts (Vercel/Netlify/Cloudflare Pages/GitHub Pages) just need build `npm run build` + dir `dist/`.
