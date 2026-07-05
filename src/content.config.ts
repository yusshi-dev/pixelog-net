// `astro:content` からユーティリティをインポートする
import { defineCollection } from "astro:content";
// Zod をインポートする
import { z } from "astro/zod";

import { github } from "./utils/github";

// 各コレクションの loader と schema を定義する
const blog = defineCollection({
    loader: github("**/index.md", "./content/posts"),
    schema: z.object({
      title: z.string(),
      published_at: z.date(),
      category: z.string(),
      tags: z.array(z.string()).nullable().optional(),
      draft: z.boolean().optional(),
    })
});
// コレクションを登録するため、collectionsオブジェクトをエクスポートする
export const collections = { blog };