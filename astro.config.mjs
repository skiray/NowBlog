import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Gitee Pages serves at https://skiray.gitee.io/now-blog/ (subpath).
export default defineConfig({
  site: "https://skiray.gitee.io/now-blog/",
  base: "/now-blog/",
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
