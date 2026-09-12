import { SITE } from "../consts";

/**
 * <title> を組み立てる。
 * ページ固有のタイトルが無い場合（ホーム）はサイト名のみ、
 * それ以外は「ページタイトル - サイト名」。
 */
export const formatDocumentTitle = (pageTitle?: string): string =>
  pageTitle ? `${pageTitle} - ${SITE.title}` : SITE.title;
