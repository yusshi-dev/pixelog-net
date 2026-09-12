import { getCollection, type CollectionEntry } from "astro:content";
import { getJstYear } from "./datetime";

export type Post = CollectionEntry<"blog">;

/** 名称と件数の組（カテゴリー・タグの集計に使う） */
export interface Counted {
  name: string;
  count: number;
}

/** 年と件数の組 */
export interface YearCount {
  year: number;
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
 * 最初の投稿年から最後の投稿年までを、件数0の年も埋めて昇順で返す。
 * スパークラインで「書いていない年」も見せたいので、間を詰めない。
 */
export const countByYearRange = (posts: Post[]): YearCount[] => {
  if (posts.length === 0) return [];

  const years = posts.map((post) => getJstYear(post.data.published_at));
  const min = Math.min(...years);
  const max = Math.max(...years);

  return Array.from({ length: max - min + 1 }, (_, i) => {
    const year = min + i;
    return { year, count: years.filter((y) => y === year).length };
  });
};
