import { JST_TIME_ZONE } from "./jst";

/**
 * Dateオブジェクトを日本時間の「2026.07.07」形式に変換する（一覧・記事の表示用）
 */
export const formatYmd = (date: Date): string =>
  new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: JST_TIME_ZONE,
  })
    .format(date)
    .replace(/\//g, ".");

/**
 * Dateオブジェクトを日本時間のISO 8601文字列（datetime属性用）に変換する
 */
export const formatISODatetime = (date: Date): string => {
  const formatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: JST_TIME_ZONE,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]));

  return `${partMap.year}-${partMap.month}-${partMap.day}T${partMap.hour}:${partMap.minute}:${partMap.second}+09:00`;
};

/**
 * 日本時間での年を取得する（年グルーピング用）
 */
export const getJstYear = (date: Date): number =>
  Number(new Intl.DateTimeFormat("en-US", { year: "numeric", timeZone: JST_TIME_ZONE }).format(date));

/**
 * 日本時間での年月を取得する（月別集計用）
 */
export const getJstYearMonth = (date: Date): { year: number; month: number } => {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    timeZone: JST_TIME_ZONE,
  }).formatToParts(date);

  const partMap = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return { year: Number(partMap.year), month: Number(partMap.month) };
};
