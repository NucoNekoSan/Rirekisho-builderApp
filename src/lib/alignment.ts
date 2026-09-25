// テキスト配置の読み書き: PDFフィールドごとの左/中央/右揃え設定を管理する
import type { TextAlignment, TextAlignmentMap } from './types';

export const getTextAlignment = (alignments: TextAlignmentMap, key: string): TextAlignment =>
  alignments[key] ?? 'left';

export const setTextAlignment = (
  alignments: TextAlignmentMap,
  key: string,
  alignment: TextAlignment,
): TextAlignmentMap => {
  const next = { ...alignments };
  if (alignment === 'left') {
    delete next[key];
  } else {
    next[key] = alignment;
  }
  return next;
};

export const removeTextAlignmentPrefix = (
  alignments: TextAlignmentMap,
  prefix: string,
): TextAlignmentMap =>
  Object.entries(alignments).reduce<TextAlignmentMap>((next, [key, alignment]) => {
    if (!key.startsWith(prefix)) next[key] = alignment;
    return next;
  }, {});
