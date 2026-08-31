import type { APIContext } from "astro";
import { getCategories, getPostsByCategory } from "../../../../i18n/content";
import { generateListRss } from "../../../../i18n/rss";
import { useTranslations } from "../../../../i18n/ui";

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
    `${category} — ${t("rss.title")}`,
    `Posts in category ${category}.`,
    posts
  );
}
