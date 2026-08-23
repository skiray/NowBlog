import type { APIContext } from "astro";
import { getPosts, getPostsByTag } from "../../../../i18n/content";
import { generateListRss } from "../../../../i18n/rss";
import { useTranslations } from "../../../../i18n/ui";

export async function getStaticPaths() {
  const posts = await getPosts("en");
  const tags = [...new Set(posts.flatMap((p) => p.data.tags))];
  return tags.map((tag) => ({ params: { tag } }));
}

export async function GET(context: APIContext) {
  const tag = context.params.tag!;
  const posts = await getPostsByTag("en", tag);
  const t = useTranslations("en");
  return generateListRss(
    context,
    "en",
    `#${tag} — ${t("rss.title")}`,
    `Posts tagged ${tag}.`,
    posts
  );
}
