import type { Post } from "./posts";

/**
 * Markdown の断片を、一覧に出せる1行のテキストにする。
 * 見出し・コード・画像・リンク記法・HTMLタグを落とす。
 */
const toPlainText = (markdown: string): string =>
  markdown
    .replace(/```[\s\S]*?```/g, " ")              // コードブロック
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")         // 画像
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")       // リンクはラベルだけ残す
    .replace(/<[^>]+>/g, " ")                      // HTMLタグ
    .replace(/^\s{0,3}#{1,6}\s+.*$/gm, "")         // 見出し行
    .replace(/^\s{0,3}>\s?/gm, "")                 // 引用記号
    .replace(/^\s*[-*+]\s+/gm, "")                 // 箇条書き記号
    .replace(/^\s*\d+\.\s+/gm, "")                 // 番号付きリスト記号
    .replace(/[*_`~]/g, "")                        // 強調記号
    .replace(/\s+/g, " ")
    .trim();

/**
 * 記事の抜粋。`<!-- more -->` がある記事はその手前を優先する（Hexo 時代の規約）。
 * 最初の「中身のある段落」1つだけを返し、長ければ切り詰める。
 */
export const getExcerpt = (post: Post, maxLength = 140): string => {
  const body = post.body ?? "";
  const source = body.split(/<!--\s*more\s*-->/i)[0].trim() || body;

  for (const block of source.split(/\n\s*\n/)) {
    const text = toPlainText(block);
    if (!text) continue;
    return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text;
  }

  return "";
};
