// `astro:content` からユーティリティをインポートする
import { defineCollection } from "astro:content";
// Zod をインポートする
import { z } from "astro/zod";

import { github } from "./utils/github";
import { parseJstDateTime } from "./utils/jst";

// published_at は「JST の壁時計・オフセット無し」で保存し、読み込み時に正しい瞬間へ正規化する。
// z.date() は文字列を実行環境のタイムゾーンで解釈しうるため使わない。
const jstDateTime = z
  .union([z.instanceof(Date), z.string()])
  .transform((value, ctx) => {
    const date = parseJstDateTime(value);

    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({ code: "custom", message: `日時として解釈できません: ${String(value)}` });
      return z.NEVER;
    }

    return date;
  });

// 各コレクションの loader と schema を定義する
const blog = defineCollection({
    loader: github("**/index.md", "./content/posts"),
    schema: z.object({
      title: z.string(),
      published_at: jstDateTime,
      category: z.string(),
      tags: z.array(z.string()).nullable().optional(),
      draft: z.boolean().optional(),
    })
});
// コレクションを登録するため、collectionsオブジェクトをエクスポートする
export const collections = { blog };
