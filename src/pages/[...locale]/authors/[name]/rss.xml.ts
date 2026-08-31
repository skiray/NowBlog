import type { APIContext } from "astro";
import { getAuthors, getPostsByAuthor } from "../../../../i18n/content";
import { generateListRss } from "../../../../i18n/rss";
import { useTranslations, type Locale } from "../../../../i18n/ui";
import { localeFrom, localePaths } from "../../../../i18n/routing";

export async function getStaticPaths() {
  const paths: { params: Record<string, string | undefined> }[] = [];

  for (const { params } of localePaths()) {
    const locale = localeFrom(params);
    for (const name of await getAuthors(locale)) {
      paths.push({ params: { ...params, name } });
    }
  }

  return paths;
}

export async function GET(context: APIContext) {
  const locale: Locale = localeFrom(context.params);
  const name = context.params.name!;
  const posts = await getPostsByAuthor(locale, name);
  const t = useTranslations(locale);

  return generateListRss(
    context,
    locale,
    `${name} — ${t("rss.title")}`,
    t("authors.desc").replace("{name}", name),
    posts
  );
}
