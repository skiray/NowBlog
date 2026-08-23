import type { APIContext } from "astro";
import { getPosts, getPostsByTag } from "../../../i18n/content";
import { generateListRss } from "../../../i18n/rss";
import { useTranslations } from "../../../i18n/ui";

export async function getStaticPaths() {
  const posts = await getPosts("zh");
  const tags = [...new Set(posts.flatMap((p) => p.data.tags))];
  return tags.map((tag) => ({ params: { tag } }));
}

export async function GET(context: APIContext) {
  const tag = context.params.tag!;
  const posts = await getPostsByTag("zh", tag);
  const t = useTranslations("zh");
  return generateListRss(
    context,
    "zh",
    `#${tag} — ${t("rss.title")}`,
    `标签 ${tag} 下的文章订阅。`,
    posts
  );
}
