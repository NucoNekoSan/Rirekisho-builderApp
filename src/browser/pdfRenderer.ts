// PDF生成パイプライン: html2canvasでDOMをCanvas化 → jsPDFでPDFに変換 → 表示/ダウンロード
import { JPEG_QUALITY } from '../lib/config';
import type { PdfPaperFormat } from '../lib/types';
import { downloadBlob } from './downloadFile';

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const A3_LANDSCAPE_WIDTH_MM = 420;
const A3_LANDSCAPE_HEIGHT_MM = 297;

/**
 * html2canvas のスケール倍率。値が大きいほどPDF出力が鮮明になるが、
 * メモリ消費と処理時間が増える。実際のスケールは max(この値, devicePixelRatio)。
 */
export const PDF_CANVAS_SCALE = 3;

interface CanvasSlice {
  offsetY: number;
  height: number;
  pageHeight: number;
}

type PdfPageOrientation = 'p' | 'portrait' | 'l' | 'landscape';

interface PdfDocument {
  addPage: (format?: string | number[], orientation?: PdfPageOrientation) => void;
  addImage: (imageData: string, format: string, x: number, y: number, width: number, height: number) => void;
}

interface PdfPaperSpec {
  format: 'a4' | 'a3';
  orientation: Extract<PdfPageOrientation, 'portrait' | 'landscape'>;
  widthMm: number;
  heightMm: number;
}

export interface PdfSourceElement {
  element: HTMLElement;
  paperFormat: PdfPaperFormat;
}

type PdfSource = HTMLElement | PdfSourceElement;

const PDF_PAPER_SPECS: Record<PdfPaperFormat, PdfPaperSpec> = {
  'a4-portrait': {
    format: 'a4',
    orientation: 'portrait',
    widthMm: A4_WIDTH_MM,
    heightMm: A4_HEIGHT_MM,
  },
  'a3-landscape': {
    format: 'a3',
    orientation: 'landscape',
    widthMm: A3_LANDSCAPE_WIDTH_MM,
    heightMm: A3_LANDSCAPE_HEIGHT_MM,
  },
};

const renderElement = async (element: HTMLElement): Promise<HTMLCanvasElement> => {
  const { default: html2canvas } = await import('html2canvas');
  return html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: Math.max(PDF_CANVAS_SCALE, window.devicePixelRatio || 1),
    useCORS: true,
  });
};

const drawPageSlice = (canvas: HTMLCanvasElement, slice: CanvasSlice): HTMLCanvasElement => {
  const pageCanvas = document.createElement('canvas');
  pageCanvas.width = canvas.width;
  pageCanvas.height = slice.pageHeight;

  const context = pageCanvas.getContext('2d');
  if (!context) throw new Error('PDFページ分割用Canvasを作成できませんでした。');

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
  context.drawImage(
    canvas,
    0,
    slice.offsetY,
    canvas.width,
    slice.height,
    0,
    0,
    canvas.width,
    slice.height,
  );
  return pageCanvas;
};

const getCanvasSlices = (canvasWidth: number, canvasHeight: number, pageWidthMm: number, pageHeightMm: number): CanvasSlice[] => {
  if (canvasWidth <= 0 || canvasHeight <= 0) return [];
  const pageHeight = Math.max(1, Math.floor((canvasWidth * pageHeightMm) / pageWidthMm));
  const pageTolerance = Math.max(2, Math.ceil(pageHeight * 0.002));
  const slices: CanvasSlice[] = [];
  for (let offsetY = 0; offsetY < canvasHeight;) {
    const remainingHeight = canvasHeight - offsetY;
    const isLastPage = remainingHeight <= pageHeight + pageTolerance;
    const height = isLastPage ? Math.min(pageHeight, remainingHeight) : pageHeight;
    slices.push({
      offsetY,
      height,
      pageHeight,
    });
    if (isLastPage) break;
    offsetY += pageHeight;
  }
  return slices;
};

export const getA4CanvasSlices = (canvasWidth: number, canvasHeight: number): CanvasSlice[] =>
  getCanvasSlices(canvasWidth, canvasHeight, A4_WIDTH_MM, A4_HEIGHT_MM);

export const getA3LandscapeCanvasSlices = (canvasWidth: number, canvasHeight: number): CanvasSlice[] =>
  getCanvasSlices(canvasWidth, canvasHeight, A3_LANDSCAPE_WIDTH_MM, A3_LANDSCAPE_HEIGHT_MM);

const normalizePdfSource = (source: PdfSource): PdfSourceElement =>
  source instanceof HTMLElement ? { element: source, paperFormat: 'a4-portrait' } : source;

const addCanvasToPdfPages = (
  pdf: PdfDocument,
  canvas: HTMLCanvasElement,
  hasPage: boolean,
  paperSpec: PdfPaperSpec,
): boolean => {
  const slices = getCanvasSlices(canvas.width, canvas.height, paperSpec.widthMm, paperSpec.heightMm);
  let pageExists = hasPage;

  for (const slice of slices) {
    if (pageExists) {
      pdf.addPage(paperSpec.format, paperSpec.orientation);
    } else {
      pageExists = true;
    }

    const pageCanvas = drawPageSlice(canvas, slice);
    pdf.addImage(pageCanvas.toDataURL('image/jpeg', JPEG_QUALITY), 'JPEG', 0, 0, paperSpec.widthMm, paperSpec.heightMm);
  }

  return pageExists;
};

export const createPdfBlobFromElements = async (elements: PdfSource[]): Promise<Blob> => {
  const { jsPDF } = await import('jspdf');
  const sources = elements.map(normalizePdfSource);
  const firstSpec = sources[0] ? PDF_PAPER_SPECS[sources[0].paperFormat] : PDF_PAPER_SPECS['a4-portrait'];
  const pdf = new jsPDF({ orientation: firstSpec.orientation, unit: 'mm', format: firstSpec.format });
  let hasPage = false;
  for (const source of sources) {
    const canvas = await renderElement(source.element);
    hasPage = addCanvasToPdfPages(pdf, canvas, hasPage, PDF_PAPER_SPECS[source.paperFormat]);
  }
  return pdf.output('blob');
};

const ensurePdfFileName = (fileName: string): string =>
  fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;

const preparePdfPreview = (opened: Window, fileName: string) => {
  opened.document.title = fileName;
  opened.document.body.replaceChildren();
  opened.document.documentElement.lang = 'ja';

  const status = opened.document.createElement('p');
  status.textContent = 'PDFを生成しています。';
  status.setAttribute('role', 'status');
  status.style.cssText = 'font: 16px system-ui, sans-serif; margin: 24px; color: #24302f;';
  opened.document.body.append(status);
};

export const openPdfPreviewWindow = (fileName = 'rirekisho.pdf'): Window => {
  const safeFileName = ensurePdfFileName(fileName);
  const opened = window.open('', '_blank');
  if (!opened) {
    throw new Error('PDFを表示する新しいタブを開けませんでした。ブラウザのポップアップ設定を確認するか、PDF保存を使ってください。');
  }

  opened.opener = null;
  preparePdfPreview(opened, safeFileName);
  return opened;
};

const appendPdfPreview = (opened: Window, url: string, fileName: string) => {
  opened.document.title = fileName;
  opened.document.body.replaceChildren();
  opened.document.documentElement.lang = 'ja';

  const style = opened.document.createElement('style');
  style.textContent = `
    * { box-sizing: border-box; }
    body { margin: 0; background: #2f3437; color: #111; font-family: system-ui, sans-serif; }
    iframe { display: block; width: 100vw; height: 100vh; border: 0; background: #fff; }
  `;

  const iframe = opened.document.createElement('iframe');
  iframe.src = url;
  iframe.title = fileName;

  opened.document.head.append(style);
  opened.document.body.append(iframe);
};

export const openBlobInNewTab = (blob: Blob, fileName = 'rirekisho.pdf') => {
  const safeFileName = ensurePdfFileName(fileName);
  const opened = openPdfPreviewWindow(safeFileName);
  const url = URL.createObjectURL(blob);
  try {
    appendPdfPreview(opened, url, safeFileName);
  } catch (error) {
    URL.revokeObjectURL(url);
    opened.close();
    throw error;
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

export const openPdfFromElements = async (elements: PdfSource[], fileName: string) => {
  const opened = openPdfPreviewWindow(fileName);
  try {
    const blob = await createPdfBlobFromElements(elements);
    const safeFileName = ensurePdfFileName(fileName);
    const url = URL.createObjectURL(blob);
    try {
      appendPdfPreview(opened, url, safeFileName);
    } catch (error) {
      URL.revokeObjectURL(url);
      throw error;
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    opened.close();
    throw error;
  }
};

export const downloadPdfFromElements = async (elements: PdfSource[], fileName: string) => {
  const blob = await createPdfBlobFromElements(elements);
  downloadBlob(blob, ensurePdfFileName(fileName));
};
