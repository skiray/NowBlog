import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import rehypeMermaid from "./src/plugins/rehype-mermaid.mjs";

import expressiveCode from "astro-expressive-code";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";

// Cloudflare Pages serves at the project root (no subpath).
export default defineConfig({
  site: "https://nowblog.pages.dev/",
  integrations: [
    sitemap(),
    expressiveCode({
      themes: ["github-light", "github-dark"],
      // Layout.astro's inline script always sets <html data-theme="light|dark">,
      // so code blocks follow the site theme rather than the OS preference.
      useDarkModeMediaQuery: false,
      themeCssSelector: (theme) =>
        `[data-theme='${theme.name.includes("dark") ? "dark" : "light"}']`,
      defaultProps: {
        wrap: true,
        preserveIndent: true,
      },
      plugins: [pluginLineNumbers()],
    }),
  ],
  markdown: {
    rehypePlugins: [rehypeMermaid],
  },
  i18n: {
    defaultLocale: "zh",
    locales: ["zh", "en"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});