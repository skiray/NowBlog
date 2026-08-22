import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Cloudflare Pages serves at the project root (no subpath).
export default defineConfig({
  site: "https://nowblog.pages.dev/",
  integrations: [sitemap()],
  markdown: {
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
