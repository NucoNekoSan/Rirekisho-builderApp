import { describe, expect, it, vi } from 'vitest';
import { getA3LandscapeCanvasSlices, getA4CanvasSlices, openBlobInNewTab, openPdfPreviewWindow, PDF_CANVAS_SCALE } from './pdfRenderer';

describe('getA4CanvasSlices', () => {
  it('PDF出力用CanvasをA4印刷向けの固定高解像度で描画する', () => {
    expect(PDF_CANVAS_SCALE).toBe(3);
  });

  it('A4の高さ以内なら1ページ分だけ返す', () => {
    expect(getA4CanvasSlices(1000, 1200)).toEqual([
      { offsetY: 0, height: 1200, pageHeight: 1414 },
    ]);
  });

  it('A4を超えた高さを複数ページに分割する', () => {
    expect(getA4CanvasSlices(1000, 3000)).toEqual([
      { offsetY: 0, height: 1414, pageHeight: 1414 },
      { offsetY: 1414, height: 1414, pageHeight: 1414 },
      { offsetY: 2828, height: 172, pageHeight: 1414 },
    ]);
  });

  it('A3横の高さに合わせてCanvasを分割する', () => {
    expect(getA3LandscapeCanvasSlices(1000, 1200)).toEqual([
      { offsetY: 0, height: 707, pageHeight: 707 },
      { offsetY: 707, height: 493, pageHeight: 707 },
    ]);
  });

  it('無効なCanvasサイズでは空配列を返す', () => {
    expect(getA4CanvasSlices(0, 1000)).toEqual([]);
    expect(getA4CanvasSlices(1000, 0)).toEqual([]);
  });

  it('PDF表示用の新しいタブが開けない場合は失敗として扱う', () => {
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    const createObjectURL = vi.fn(() => 'blob:test-pdf');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
    vi.spyOn(window, 'open').mockReturnValue(null);

    try {
      expect(() => openBlobInNewTab(new Blob(['pdf']))).toThrow('PDFを表示する新しいタブを開けませんでした。');
      expect(createObjectURL).not.toHaveBeenCalled();
      expect(revokeObjectURL).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: originalCreateObjectURL });
      Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: originalRevokeObjectURL });
      vi.restoreAllMocks();
    }
  });

  it('PDF生成前に新しいタブを開いて生成中メッセージを表示する', () => {
    const previewDocument = document.implementation.createHTMLDocument();
    const previewWindow = {
      document: previewDocument,
      opener: {},
    } as Window;
    vi.spyOn(window, 'open').mockReturnValue(previewWindow);

    try {
      const opened = openPdfPreviewWindow('rirekisho-a3');

      expect(opened).toBe(previewWindow);
      expect(window.open).toHaveBeenCalledWith('', '_blank');
      expect(previewWindow.opener).toBeNull();
      expect(previewDocument.title).toBe('rirekisho-a3.pdf');
      expect(previewDocument.body.textContent).toContain('PDFを生成しています。');
    } finally {
      vi.restoreAllMocks();
    }
  });

  it('PDF表示用タブにブラウザ標準ビューアで開く iframe を作成する', () => {
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    const createObjectURL = vi.fn(() => 'blob:preview-pdf');
    const revokeObjectURL = vi.fn();
    const previewDocument = document.implementation.createHTMLDocument();
    const previewWindow = {
      document: previewDocument,
      opener: {},
    } as Window;
    vi.useFakeTimers();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
    vi.spyOn(window, 'open').mockReturnValue(previewWindow);

    try {
      openBlobInNewTab(new Blob(['pdf'], { type: 'application/pdf' }), 'rirekisho-a3');

      expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      expect(window.open).toHaveBeenCalledWith('', '_blank');
      expect(previewDocument.title).toBe('rirekisho-a3.pdf');
      expect(previewDocument.querySelector('a')).toBeNull();
      expect(previewDocument.querySelector('iframe')?.getAttribute('src')).toBe('blob:preview-pdf');

      vi.runAllTimers();
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview-pdf');
    } finally {
      Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: originalCreateObjectURL });
      Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: originalRevokeObjectURL });
      vi.useRealTimers();
      vi.restoreAllMocks();
    }
  });
});
