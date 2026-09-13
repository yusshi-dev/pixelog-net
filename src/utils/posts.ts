import { getCollection, type CollectionEntry } from "astro:content";
import { getJstYear, getJstYearMonth } from "./datetime";

export type Post = CollectionEntry<"blog">;

/** 名称と件数の組（カテゴリー・タグの集計に使う） */
export interface Counted {
  name: string;
  count: number;
}

/** 年月と件数の組 */
export interface MonthCount {
  year: number;
  /** 1〜12 */
  month: number;
  count: number;
}

export const getPublishedPosts = async (): Promise<Post[]> =>
  (await getCollection("blog"))
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.published_at.getTime() - a.data.published_at.getTime());

export const getTags = (posts: Post[]): string[] =>
  [...new Set(posts.flatMap((post) => post.data.tags ?? []))];

export const getCategories = (posts: Post[]): string[] =>
  [...new Set(posts.map((post) => post.data.category))];

export const getYears = (posts: Post[]): number[] =>
  [...new Set(posts.map((post) => getJstYear(post.data.published_at)))].sort((a, b) => b - a);

export const postsInCategory = (posts: Post[], category: string): Post[] =>
  posts.filter((post) => post.data.category === category);

export const postsWithTag = (posts: Post[], tag: string): Post[] =>
  posts.filter((post) => post.data.tags?.includes(tag));

/** カテゴリーを件数の多い順に並べる */
export const countByCategory = (posts: Post[]): Counted[] =>
  getCategories(posts)
    .map((name) => ({ name, count: postsInCategory(posts, name).length }))
    .sort((a, b) => b.count - a.count);

/** タグを件数の多い順に並べる */
export const countByTag = (posts: Post[]): Counted[] =>
  getTags(posts)
    .map((name) => ({ name, count: postsWithTag(posts, name).length }))
    .sort((a, b) => b.count - a.count);

/**
 * 最も新しい投稿の月から遡って months ヶ月分の件数を、古い順で返す。
 * 投稿が無い月も0件として残す（グラフの間隔を詰めないため）。
 *
 * 終点を「今日」ではなく「最新の投稿」にしているのは、記事を追加せずに
 * ビルドしたときに窓だけが進んで、直近の記録が消えてしまうのを避けるため。
 */
export const countByMonthRange = (posts: Post[], months: number): MonthCount[] => {
  if (posts.length === 0) return [];

  const newest = getJstYearMonth(
    new Date(Math.max(...posts.map((post) => post.data.published_at.getTime()))),
  );

  const buckets: MonthCount[] = [];
  for (let offset = months - 1; offset >= 0; offset--) {
    // Date.UTC は月に負の値を渡しても年をまたいで繰り下がる
    const cursor = new Date(Date.UTC(newest.year, newest.month - 1 - offset, 1));
    buckets.push({
      year: cursor.getUTCFullYear(),
      month: cursor.getUTCMonth() + 1,
      count: 0,
    });
  }

  for (const post of posts) {
    const { year, month } = getJstYearMonth(post.data.published_at);
    const bucket = buckets.find((item) => item.year === year && item.month === month);
    if (bucket) bucket.count += 1;
  }

  return buckets;
};
