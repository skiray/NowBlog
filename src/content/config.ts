import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { CATEGORY_IDS } from "../data/categories";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    category: z
      .string()
      .optional()
      .refine((v) => v === undefined || CATEGORY_IDS.includes(v), {
        message: `category 必须是 src/data/categories.ts 中注册的 id: ${CATEGORY_IDS.join(", ")}`,
      }),
    author: z.string().default("Skr"),
    cover: z.string().optional(),
    series: z.string().optional(),
    seriesOrder: z.number().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
