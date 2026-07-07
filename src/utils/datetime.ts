/**
 * 渡されたDateオブジェクトの9時間のズレ（JSTをUTCと誤認したパース）を補正する内部関数
 * 9時間（9 * 60 * 60 * 1000 ミリ秒）を引いて、正しいUTC時刻に戻します
 */
const adjustDate = (date: Date): Date => {
  const JST_OFFSET = 9 * 60 * 60 * 1000;
  return new Date(date.getTime() - JST_OFFSET);
};

/**
 * Dateオブジェクトを日本時間ベースの表示用文字列（例: Jul 23）に変換する
 */
export const formatDate = (date: Date): string => {
  const correctedDate = adjustDate(date);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Tokyo'
  }).format(correctedDate);
};

export const formatDateYear = (date: Date): string => {
  const correctedDate = adjustDate(date);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Tokyo'
  }).format(correctedDate);
};

/**
 * Dateオブジェクトを日本時間のISO 8601文字列（datetime属性用）に変換する
 */
export const formatISODatetime = (date: Date): string => {
  const correctedDate = adjustDate(date);
  const formatter = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(correctedDate);
  const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]));
  
  return `${partMap.year}-${partMap.month}-${partMap.day}T${partMap.hour}:${partMap.minute}:${partMap.second}+09:00`;
};