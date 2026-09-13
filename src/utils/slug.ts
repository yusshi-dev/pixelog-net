import type { CollectionEntry } from 'astro:content';

export function getPostSlug(post: CollectionEntry<'blog'>) {
  // ファイル名（id）から日付を除去してURL用のスラッグを返す
  return post.id.replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

/** 年別アーカイブのURL（例: /archive/2026/） */
export const getYearPath = (year: number): string => `/archive/${year}/`;

/** 月別アーカイブのURL（例: /archive/2026/07/） */
export const getMonthPath = (year: number, month: number): string =>
  `/archive/${year}/${String(month).padStart(2, "0")}/`;
