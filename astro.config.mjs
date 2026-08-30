import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import rehypeMermaid from "./src/plugins/rehype-mermaid.mjs";

// Cloudflare Pages serves at the project root (no subpath).
export default defineConfig({
  site: "https://nowblog.pages.dev/",
  integrations: [sitemap()],
  markdown: {
    rehypePlugins: [rehypeMermaid],
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      wrap: true,
    },
  },
  i18n: {
    defaultLocale: "zh",
    locales: ["zh", "en"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
