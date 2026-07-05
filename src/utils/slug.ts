import type { CollectionEntry } from 'astro:content';

export function getPostSlug(post: CollectionEntry<'blog'>) {
  // ファイル名（id）から日付を除去してURL用のスラッグを返す
  return post.id.replace(/^\d{4}-\d{2}-\d{2}-/, '');
}