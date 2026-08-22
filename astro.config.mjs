import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Replace with your real domain so RSS/sitemap URLs are correct.
export default defineConfig({
  site: "https://example.com",
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
