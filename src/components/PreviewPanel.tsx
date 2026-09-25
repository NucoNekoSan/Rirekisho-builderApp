// PDFプレビューパネル: 右カラムに表示されるリアルタイムPDFプレビューとPDF出力ボタン
import type { ReactNode, RefObject } from 'react';

export type PreviewScale = 'fit' | 'large';
export type PreviewPage = 'resume' | 'accommodation';

interface PreviewPanelProps {
  previewScale: PreviewScale;
  setPreviewScale: (scale: PreviewScale) => void;
  showPageTabs: boolean;
  activePreviewPage: PreviewPage;
  setPreviewPage: (page: PreviewPage) => void;
  resumePaperFormatLabel: string;
  activePreviewFormat: string;
  previewA4PageCount: number | null;
  showAccommodationButtons: boolean;
  isGeneratingPdf: boolean;
  isPdfOutputBlocked: boolean;
  pdfOutputBlockReason: string;
  onOpenPreviewDialog: () => void;
  runPdfAction: (mode: 'open' | 'download', includeAccommodation: boolean) => void;
  previewPaperClass: string;
  previewPagesRef: RefObject<HTMLDivElement | null>;
  previewFrameHeight: number | null;
  resumePreview: ReactNode;
  accommodationPreview: ReactNode;
}

function PreviewPageFrame({ children, height }: { children: ReactNode; height: number | null }) {
  return <div className="preview-page-frame" style={height ? { height: `${height}px` } : undefined}>{children}</div>;
}

export function PreviewPanel({
  previewScale,
  setPreviewScale,
  showPageTabs,
  activePreviewPage,
  setPreviewPage,
  resumePaperFormatLabel,
  activePreviewFormat,
  previewA4PageCount,
  showAccommodationButtons,
  isGeneratingPdf,
  isPdfOutputBlocked,
  pdfOutputBlockReason,
  onOpenPreviewDialog,
  runPdfAction,
  previewPaperClass,
  previewPagesRef,
  previewFrameHeight,
  resumePreview,
  accommodationPreview,
}: PreviewPanelProps) {
  return (
    <aside className="preview-panel" id="preview-panel" aria-label="PDFプレビュー">
      <div className="preview-sticky">
        <div className="preview-heading">
          <h2>PDFプレビュー</h2>
          <div className="preview-toolbar" role="group" aria-label="PDFプレビュー倍率">
            <button type="button" className={previewScale === 'fit' ? 'active' : ''} aria-pressed={previewScale === 'fit'} onClick={() => setPreviewScale('fit')}>全体表示</button>
            <button type="button" className={previewScale === 'large' ? 'active' : ''} aria-pressed={previewScale === 'large'} onClick={() => setPreviewScale('large')}>拡大表示</button>
          </div>
        </div>
        {showPageTabs ? (
          <div className="preview-tabs" role="group" aria-label="プレビューするページ">
            <button type="button" className={activePreviewPage === 'resume' ? 'active' : ''} aria-pressed={activePreviewPage === 'resume'} onClick={() => setPreviewPage('resume')}>履歴書（{resumePaperFormatLabel}）</button>
            <button type="button" className={activePreviewPage === 'accommodation' ? 'active' : ''} aria-pressed={activePreviewPage === 'accommodation'} onClick={() => setPreviewPage('accommodation')}>配慮事項シート（A4縦）</button>
          </div>
        ) : null}
        <p className="preview-note">
          {previewA4PageCount
            ? `PDF保存時は、この表示内容を${activePreviewFormat} ${previewA4PageCount}ページとして出力します。`
            : `PDF保存時は、入力内容を意味単位で${activePreviewFormat}ページへ分割します。`}
        </p>
        <div className="preview-actions" aria-label="PDF出力操作">
          <button type="button" className="secondary preview-large-button" onClick={onOpenPreviewDialog}>PDFを大きく確認</button>
          <button type="button" onClick={() => runPdfAction('open', false)} disabled={isGeneratingPdf || isPdfOutputBlocked}>履歴書PDFを表示</button>
          <button type="button" onClick={() => runPdfAction('download', false)} disabled={isGeneratingPdf || isPdfOutputBlocked}>履歴書PDFを保存</button>
          {showAccommodationButtons ? (
            <>
              <button type="button" onClick={() => runPdfAction('open', true)} disabled={isGeneratingPdf || isPdfOutputBlocked}>履歴書+配慮事項PDFを表示</button>
              <button type="button" onClick={() => runPdfAction('download', true)} disabled={isGeneratingPdf || isPdfOutputBlocked}>履歴書+配慮事項PDFを保存</button>
            </>
          ) : null}
        </div>
        {isPdfOutputBlocked ? <p className="warning-text" role="alert">{pdfOutputBlockReason}</p> : null}
        <div className={`preview-pages preview-${previewScale} ${previewPaperClass}`} ref={previewPagesRef}>
          <PreviewPageFrame height={previewFrameHeight}>
            {activePreviewPage === 'resume' ? resumePreview : accommodationPreview}
          </PreviewPageFrame>
        </div>
      </div>
    </aside>
  );
}
