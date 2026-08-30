import type { APIContext } from "astro";
import { getPosts, getPostsByTag } from "../../../../i18n/content";
import { generateListRss } from "../../../../i18n/rss";
import { useTranslations, type Locale } from "../../../../i18n/ui";
import { localeFrom, localePaths } from "../../../../i18n/routing";

export async function getStaticPaths() {
  const paths: { params: Record<string, string | undefined> }[] = [];

  for (const { params } of localePaths()) {
    const locale = localeFrom(params);
    const posts = await getPosts(locale);
    const tags = [...new Set(posts.flatMap((p) => p.data.tags))];
    for (const tag of tags) paths.push({ params: { ...params, tag } });
  }

  return paths;
}

export async function GET(context: APIContext) {
  const locale: Locale = localeFrom(context.params);
  const tag = context.params.tag!;
  const posts = await getPostsByTag(locale, tag);
  const t = useTranslations(locale);

  return generateListRss(
    context,
    locale,
    `#${tag} — ${t("rss.title")}`,
    t("tag.desc").replace("{tag}", tag),
    posts
  );
}
