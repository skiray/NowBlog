import type { APIContext } from "astro";
import { getPosts, getPostsByAuthor } from "../../../../i18n/content";
import { generateListRss } from "../../../../i18n/rss";
import { useTranslations } from "../../../../i18n/ui";

export async function getStaticPaths() {
  const posts = await getPosts("en");
  const authors = [...new Set(posts.map((p) => p.data.author))];
  return authors.map((name) => ({ params: { name } }));
}

export async function GET(context: APIContext) {
  const name = context.params.name!;
  const posts = await getPostsByAuthor("en", name);
  const t = useTranslations("en");
  return generateListRss(
    context,
    "en",
    `${name} — ${t("rss.title")}`,
    `Posts by ${name}.`,
    posts
  );
}
