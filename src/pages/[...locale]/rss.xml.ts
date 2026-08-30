import type { APIContext } from "astro";
import { generateRss } from "../../i18n/rss";
import { localeFrom, localePaths } from "../../i18n/routing";

export function getStaticPaths() {
  return localePaths();
}

export async function GET(context: APIContext) {
  return generateRss(context, localeFrom(context.params));
}
