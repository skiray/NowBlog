import type { APIContext } from "astro";
import { generateRss } from "../../i18n/rss";

export async function GET(context: APIContext) {
  return generateRss(context, "en");
}
