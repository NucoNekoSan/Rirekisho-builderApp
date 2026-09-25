// ファイルダウンロード: Blobを生成しブラウザのダウンロードダイアログを発動する

export const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

/** テキストデータをファイルとしてダウンロードさせる（プロジェクトJSON保存に使用） */
export const downloadTextFile = (fileName: string, text: string, mimeType = 'application/json') => {
  downloadBlob(new Blob([text], { type: mimeType }), fileName);
};
