import type { APIContext } from "astro";
import { getCategories, getPostsByCategory } from "../../../../i18n/content";
import { generateListRss } from "../../../../i18n/rss";
import { useTranslations } from "../../../../i18n/ui";
import { categoryLabel } from "../../../../data/categories";

export async function getStaticPaths() {
  const categories = await getCategories("en");
  return categories.map((category) => ({ params: { category } }));
}

export async function GET(context: APIContext) {
  const category = context.params.category!;
  const posts = await getPostsByCategory("en", category);
  const t = useTranslations("en");
  return generateListRss(
    context,
    "en",
    `${categoryLabel("en", category)} — ${t("rss.title")}`,
    `Posts in category ${categoryLabel("en", category)}.`,
    posts
  );
}
