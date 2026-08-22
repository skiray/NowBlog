import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Cloudflare Pages serves at the project root (no subpath).
// Replace `now-blog` below with your real *.pages.dev project name if different.
export default defineConfig({
  site: "https://now-blog.pages.dev/",
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
