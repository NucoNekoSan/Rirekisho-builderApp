// テキスト正規化: 全角数字→半角変換（NFKC）と数字のみ抽出

/** 全角→半角変換（Unicode NFKC正規化）。全角数字「０１２」→「012」等 */
export const normalizeNfkc = (value: string): string => value.normalize('NFKC');

export const extractDigits = (value: string): string => normalizeNfkc(value).replace(/\D/g, '');
