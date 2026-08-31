import { getCollection, type CollectionEntry } from "astro:content";
import type { Locale } from "./ui";

export type Post = CollectionEntry<"blog">;

/** Posts shown per blog listing page. */
export const PAGE_SIZE = 6;

export function slugOf(post: Post): string {
  return post.id.split("/")[1];
}

export function localeOf(post: Post): string {
  return post.id.split("/")[0];
}

export async function getPosts(locale: Locale): Promise<Post[]> {
  const all = await getCollection("blog");
  const isDev = import.meta.env.DEV;
  const now = Date.now();
  return all
    .filter((p) => localeOf(p) === locale)
    .filter((p) => !p.data.draft)
    .filter((p) => isDev || p.data.pubDate.valueOf() <= now)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function tagHref(locale: Locale, tag: string): string {
  const p = locale === "en" ? "/en" : "";
  return `${p}/tags/${encodeURIComponent(tag)}/`;
}

export function authorHref(locale: Locale, author: string): string {
  const p = locale === "en" ? "/en" : "";
  return `${p}/authors/${encodeURIComponent(author)}/`;
}

export function categoryHref(locale: Locale, category: string): string {
  const p = locale === "en" ? "/en" : "";
  return `${p}/categories/${encodeURIComponent(category)}/`;
}

/** Posts by a given author, newest first. */
export async function getPostsByAuthor(
  locale: Locale,
  author: string
): Promise<Post[]> {
  const posts = await getPosts(locale);
  return posts.filter((p) => p.data.author === author);
}

/** Posts carrying a given tag, newest first. */
export async function getPostsByTag(
  locale: Locale,
  tag: string
): Promise<Post[]> {
  const posts = await getPosts(locale);
  return posts.filter((p) => p.data.tags.includes(tag));
}

/** Posts in a given category, newest first. */
export async function getPostsByCategory(
  locale: Locale,
  category: string
): Promise<Post[]> {
  const posts = await getPosts(locale);
  return posts.filter((p) => p.data.category === category);
}

/** Distinct author names present in a locale. */
export async function getAuthors(locale: Locale): Promise<string[]> {
  const posts = await getPosts(locale);
  return [...new Set(posts.map((p) => p.data.author))].sort();
}

/** Distinct categories present in a locale. */
export async function getCategories(locale: Locale): Promise<string[]> {
  const posts = await getPosts(locale);
  return [...new Set(posts.map((p) => p.data.category).filter(Boolean))].sort();
}

/** Posts in the same series as `current`, ordered by seriesOrder then date. */
export async function getSeries(
  locale: Locale,
  current: Post
): Promise<Post[]> {
  const series = current.data.series;
  if (!series) return [];
  const posts = await getPosts(locale);
  return posts
    .filter((p) => p.data.series === series)
    .sort(
      (a, b) =>
        (a.data.seriesOrder ?? 0) - (b.data.seriesOrder ?? 0) ||
        a.data.pubDate.valueOf() - b.data.pubDate.valueOf()
    );
}

export function blogHref(locale: Locale): string {
  return locale === "en" ? "/en/blog/" : "/blog/";
}

export type ArchiveGroup = { year: number; posts: Post[] };

/** Posts grouped by publication year, newest year first. */
export async function getArchive(locale: Locale): Promise<ArchiveGroup[]> {
  const posts = await getPosts(locale);
  const groups = new Map<number, Post[]>();
  for (const p of posts) {
    const year = p.data.pubDate.getFullYear();
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year)!.push(p);
  }
  return [...groups.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, ps]) => ({ year, posts: ps }));
}

/** Newer / older post relative to `current`, by publish date (desc). */
export async function getAdjacent(locale: Locale, current: Post) {
  const all = await getPosts(locale);
  const idx = all.findIndex((p) => p.id === current.id);
  return {
    newer: idx > 0 ? all[idx - 1] : undefined,
    older: idx >= 0 && idx < all.length - 1 ? all[idx + 1] : undefined,
  };
}

/** Posts sharing the most tags with `current`, excluding itself. */
export async function getRelated(
  locale: Locale,
  current: Post,
  n = 3
): Promise<Post[]> {
  const all = await getPosts(locale);
  const tags = new Set(current.data.tags);
  return all
    .filter((p) => p.id !== current.id)
    .map((p) => ({
      p,
      score: p.data.tags.filter((tag) => tags.has(tag)).length,
    }))
    .filter((x) => x.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.p.data.pubDate.valueOf() - a.p.data.pubDate.valueOf()
    )
    .slice(0, n)
    .map((x) => x.p);
}

/** Estimated reading time in minutes (CJK chars + Latin words heuristic). */
export function readingMinutes(post: Post): number {
  const text = post.body ?? "";
  const cjk = (text.match(/[一-鿿]/g) ?? []).length;
  const words = (text.match(/[a-zA-Z0-9]+/g) ?? []).length;
  return Math.max(1, Math.round(cjk / 400 + words / 200));
}
