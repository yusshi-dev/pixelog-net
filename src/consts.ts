export const SITE = {
  title: "Pixelog",
  description: "技術に関するメモと日記",
  url: "https://pixelog.net",
  author: "yusshi",
} as const;

/** グローバルナビ。key は各ページの current と対応する */
export const NAV_ITEMS = [
  { key: "posts", href: "/", label: "記事" },
  { key: "categories", href: "/categories/", label: "カテゴリ" },
  { key: "tags", href: "/tags/", label: "タグ" },
  { key: "about", href: "/about/", label: "このサイトについて" },
] as const;

export type NavKey = (typeof NAV_ITEMS)[number]["key"];

/** サイドバー「リンク」 */
export const SIDEBAR_LINKS = [
  { href: "/about/", label: "このサイトについて" },
  { href: "/atom.xml", label: "RSS" },
] as const;

/** フッター */
export const FOOTER_LINKS = [
  { href: "/", label: "ホーム" },
  { href: "/about/", label: "このサイトについて" },
  { href: "/atom.xml", label: "RSS" },
] as const;

export const RECENT_POSTS_COUNT = 5;

export const FEED_MAX_ITEMS = 10;

/** 一覧の1ページあたりの件数 */
export const POSTS_PER_PAGE = 10;

/** サイドバー「記録の推移」で見せる月数 */
export const ACTIVITY_MONTHS = 12;
