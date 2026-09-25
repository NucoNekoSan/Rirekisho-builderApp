// 型ガード: JSON解析時にオブジェクト型を安全に判定する

/** unknown値がプレーンオブジェクトかどうか判定する型ガード */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
