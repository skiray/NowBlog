import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getPosts, slugOf } from "./content";
import { useTranslations, type Locale } from "./ui";

export async function generateRss(context: APIContext, locale: Locale) {
  const t = useTranslations(locale);
  const posts = await getPosts(locale);
  return rss({
    title: t("rss.title"),
    description: t("rss.desc"),
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      author: post.data.author,
      categories: post.data.tags,
      link: `${locale === "en" ? "/en" : ""}/blog/${slugOf(post)}/`,
    })),
  });
}
