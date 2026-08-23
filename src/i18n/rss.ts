import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getPosts, slugOf, type Post } from "./content";
import { useTranslations, type Locale } from "./ui";

function itemsFor(locale: Locale, posts: Post[]) {
  return posts.map((post) => ({
    title: post.data.title,
    description: post.data.description,
    pubDate: post.data.pubDate,
    author: post.data.author,
    categories: post.data.tags,
    link: `${locale === "en" ? "/en" : ""}/blog/${slugOf(post)}/`,
  }));
}

export async function generateRss(context: APIContext, locale: Locale) {
  const t = useTranslations(locale);
  const posts = await getPosts(locale);
  return rss({
    title: t("rss.title"),
    description: t("rss.desc"),
    site: context.site!,
    items: itemsFor(locale, posts),
  });
}

/** RSS for an arbitrary (already filtered) list of posts. */
export async function generateListRss(
  context: APIContext,
  locale: Locale,
  title: string,
  description: string,
  posts: Post[]
) {
  return rss({
    title,
    description,
    site: context.site!,
    items: itemsFor(locale, posts),
  });
}
