import { ACTIVITY_MONTHS, RECENT_POSTS_COUNT } from "../consts";
import {
  countByCategory,
  countByMonthRange,
  countByTag,
  getPublishedPosts,
  getYears,
  type Counted,
  type MonthCount,
  type Post,
} from "./posts";

/**
 * 全ページ共通でサイドバーに渡す集計値。
 * レイアウトで1回だけ組み立てて、各ウィジェットに配る。
 */
export interface SiteSummary {
  /** 直近 activityMonths ヶ月の件数（古い順） */
  monthActivity: MonthCount[];
  /** 直近 activityMonths ヶ月ぶんの合計件数 */
  activityPostCount: number;
  activityMonths: number;
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

  const monthActivity = countByMonthRange(posts, ACTIVITY_MONTHS);

  return {
    monthActivity,
    activityPostCount: monthActivity.reduce((sum, item) => sum + item.count, 0),
    activityMonths: ACTIVITY_MONTHS,
    categories: countByCategory(posts),
    tags: countByTag(posts),
    years: getYears(posts),
    recentPosts: posts.slice(0, RECENT_POSTS_COUNT),
  };
};
