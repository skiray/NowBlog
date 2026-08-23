import type { APIContext } from "astro";
import { getPosts, getPostsByAuthor } from "../../../i18n/content";
import { generateListRss } from "../../../i18n/rss";
import { useTranslations } from "../../../i18n/ui";

export async function getStaticPaths() {
  const posts = await getPosts("zh");
  const authors = [...new Set(posts.map((p) => p.data.author))];
  return authors.map((name) => ({ params: { name } }));
}

export async function GET(context: APIContext) {
  const name = context.params.name!;
  const posts = await getPostsByAuthor("zh", name);
  const t = useTranslations("zh");
  return generateListRss(
    context,
    "zh",
    `${name} — ${t("rss.title")}`,
    `作者 ${name} 的文章订阅。`,
    posts
  );
}
