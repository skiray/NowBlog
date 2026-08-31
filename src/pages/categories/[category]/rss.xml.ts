import type { APIContext } from "astro";
import { getCategories, getPostsByCategory } from "../../../i18n/content";
import { generateListRss } from "../../../i18n/rss";
import { useTranslations } from "../../../i18n/ui";
import { categoryLabel } from "../../../data/categories";

export async function getStaticPaths() {
  const categories = await getCategories("zh");
  return categories.map((category) => ({ params: { category } }));
}

export async function GET(context: APIContext) {
  const category = context.params.category!;
  const posts = await getPostsByCategory("zh", category);
  const t = useTranslations("zh");
  return generateListRss(
    context,
    "zh",
    `${categoryLabel("zh", category)} — ${t("rss.title")}`,
    `分类 ${categoryLabel("zh", category)} 下的文章订阅。`,
    posts
  );
}
