import { getCollection, type CollectionEntry } from "astro:content";
import { getJstYear } from "./datetime";

export type Post = CollectionEntry<"blog">;

export const getPublishedPosts = async (): Promise<Post[]> =>
  (await getCollection("blog"))
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.published_at.getTime() - a.data.published_at.getTime());

export const getTags = (posts: Post[]): string[] =>
  [...new Set(posts.flatMap((post) => post.data.tags ?? []))];

export const getYears = (posts: Post[]): number[] =>
  [...new Set(posts.map((post) => getJstYear(post.data.published_at)))].sort((a, b) => b - a);
