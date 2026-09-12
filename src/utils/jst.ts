const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const HAS_EXPLICIT_OFFSET = /(?:Z|[+-]\d{2}:?\d{2})$/;

export const JST_TIME_ZONE = "Asia/Tokyo";

/**
 * frontmatter の日時は「JST の壁時計・オフセット無し」（例: 2026-09-12T13:35:00）で保存する規約。
 * 入力の来し方によらず、正しい瞬間（instant）に正規化する。
 *
 * - Date: YAML パーサがオフセット無しを UTC として型付けした値 -> JST の壁時計として復元
 * - string: オフセット付きならそのまま解釈し、無ければ +09:00 を補う
 */
export const parseJstDateTime = (value: Date | string): Date => {
  if (value instanceof Date) {
    return new Date(value.getTime() - JST_OFFSET_MS);
  }

  const normalized = value.trim().replace(" ", "T");

  if (HAS_EXPLICIT_OFFSET.test(normalized)) {
    return new Date(normalized);
  }

  return new Date(`${normalized}+09:00`);
};
