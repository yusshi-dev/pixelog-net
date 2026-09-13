import { getImage } from "astro:assets";
import MarkdownIt from "markdown-it";

import { SITE } from "../consts";
import type { Post } from "./posts";

const parser = new MarkdownIt({ html: true });
const FIRST_IMAGE = /<img\b[^>]*?\ssrc\s*=\s*(?:"([^"]*)"|'([^']*)')/i;

/**
 * 本文の Markdown を HTML にして、最初に現れる img の src を取り出す。
 * markdown-it を通すことで、コードブロック内の <img> は実体参照にエスケープされ、
 * 本文中の本物の画像だけが対象になる。
 */
const getFirstImageSrc = (body: string): string | undefined => {
  // コメントアウトされた <img> を拾わないように先に取り除く
  const html = parser.render(body.replace(/<!--[\s\S]*?-->/g, ""));
  const match = FIRST_IMAGE.exec(html);
  return match ? (match[1] ?? match[2]) : undefined;
};

/**
 * 記事からの相対パスの画像を、Astro が最適化した公開URLへ解決するために
 * content 配下の画像を遅延インポートできるようにしておく。
 */
const contentImages = import.meta.glob<{ default: ImageMetadata }>(
  "/content/posts/**/*.{jpg,jpeg,png,gif,webp,avif}",
);

/**
 * 記事の OGP 画像（絶対URL）。
 * 記事内に画像が無い（解決できない）場合は undefined を返し、呼び出し側で汎用画像にフォールバックする。
 */
export const getOgImage = async (post: Post): Promise<string | undefined> => {
  const src = getFirstImageSrc(post.body ?? "");
  if (!src) return undefined;

  // 外部URLはそのまま
  if (/^https?:\/\//i.test(src)) return src;

  // サイト内の絶対パス
  if (src.startsWith("/")) return new URL(src, SITE.url).href;

  try {
    // 記事からの相対パス（例: thumbnail.jpg）は Astro の画像最適化に載せて公開URLを得る
    const key = `/content/posts/${post.id}/${decodeURI(src).replace(/^\.\//, "")}`;
    const load = contentImages[key];
    if (!load) return undefined;

    const { default: image } = await load();
    const { src: optimized } = await getImage({ src: image });
    return new URL(optimized, SITE.url).href;
  } catch {
    return undefined;
  }
};
