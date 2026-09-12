import { RECENT_POSTS_COUNT } from "../consts";
import { countByCategory, countByTag, countByYearRange, getPublishedPosts, getYears, type Counted, type Post, type YearCount } from "./posts";

/**
 * 全ページ共通でサイドバーに渡す集計値。
 * レイアウトで1回だけ組み立てて、各ウィジェットに配る。
 */
export interface SiteSummary {
  totalPosts: number;
  /** 最初と最後の投稿日（記録の期間表示用） */
  firstPostAt: Date;
  lastPostAt: Date;
  yearActivity: YearCount[];
  categories: Counted[];
  tags: Counted[];
  years: number[];
  recentPosts: Post[];
}

export const getSiteSummary = async (): Promise<SiteSummary> => {
  const posts = await getPublishedPosts();

  if (posts.length === 0) {
    throw new Error("公開済みの記事が1件もありません。サイドバーの集計には記事が必要です。");
  }

  return {
    totalPosts: posts.length,
    // posts は新しい順なので、末尾が最古
    firstPostAt: posts[posts.length - 1].data.published_at,
    lastPostAt: posts[0].data.published_at,
    yearActivity: countByYearRange(posts),
    categories: countByCategory(posts),
    tags: countByTag(posts),
    years: getYears(posts),
    recentPosts: posts.slice(0, RECENT_POSTS_COUNT),
  };
};
