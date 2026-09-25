import { getAccommodationPrintFields, type PrintField } from './accommodation';
import type { AccommodationData, HistoryEntry, QualificationEntry, ResumeData } from './types';

type ResumeTableKind = 'histories' | 'qualifications';
type ResumeTextKind = 'motivation' | 'selfPr' | 'requests';
type ResumeTableRow = HistoryEntry | QualificationEntry;

interface ResumeProfileSection {
  type: 'profile';
}

export interface ResumeTableSection {
  type: 'table';
  kind: ResumeTableKind;
  title: string;
  continued: boolean;
  rows: ResumeTableRow[];
}

export interface ResumeTextSection {
  type: 'text';
  kind: ResumeTextKind;
  title: string;
  continued: boolean;
  value: string;
}

interface ResumeMiniSection {
  type: 'mini';
}

export type ResumePrintSection = ResumeProfileSection | ResumeTableSection | ResumeTextSection | ResumeMiniSection;

interface ResumePrintPage {
  id: string;
  pageNumber: number;
  sections: ResumePrintSection[];
}

interface AccommodationFieldSection {
  type: 'field';
  fieldKey: PrintField['fieldKey'];
  label: string;
  value: string;
  sensitive: boolean;
  continued: boolean;
}

interface AccommodationEmptySection {
  type: 'empty';
}

export type AccommodationPrintSection = AccommodationFieldSection | AccommodationEmptySection;

interface AccommodationPrintPage {
  id: string;
  pageNumber: number;
  showNote: boolean;
  sections: AccommodationPrintSection[];
}

/*
 * PDFページ分割アルゴリズム
 *
 * 「単位 (units)」は、印刷時のA4用紙上の高さにおおむね対応する抽象値。
 * A4の有効印刷領域（297mm − 上下余白 ≒ 275mm 相当）を、フォントサイズや
 * 行間を考慮してスケーリングした値。各セクションの高さを単位で見積もり、
 * 累計がページ容量を超えたら改ページする。
 *
 * これらの定数は App.css のPDF用CSSレイアウトと経験的に一致するよう調整済み。
 * CSSの余白・フォントサイズ・行間（.pdf-page, .resume-table-block 等）を変更した場合は、
 * ここの定数も再調整が必要。
 */

/** A4履歴書1ページあたりの容量（上下余白を除く） */
const RESUME_PAGE_CAPACITY_UNITS = 232;
/** A4配慮事項シート1ページあたりの容量 */
const ACCOMMODATION_PAGE_CAPACITY_UNITS = 254;
/** 同一ページ内でセクション間に入るギャップ */
const SECTION_GAP_UNITS = 4;

/** プロフィールセクション（氏名・住所・連絡先＋写真）の高さ */
const RESUME_PROFILE_UNITS = 86;
/** テーブルヘッダー行（年/月/内容）の高さ */
const RESUME_TABLE_HEADER_UNITS = 13;
/** テーブルデータ行の最小高さ（1行テキスト時） */
const RESUME_TABLE_ROW_MIN_UNITS = 7;
/** テーブルデータ行のテキスト折り返し1行あたりの高さ */
const RESUME_TABLE_ROW_LINE_UNITS = 6.6;
/** テーブルセルの1行あたり文字数。半角=0.55単位、全角=1.0単位で計算 */
const RESUME_TABLE_ROW_CHARS_PER_LINE = 34;

/** テキストボックス（志望動機・自己PR・本人希望欄）の最小高さ */
const RESUME_TEXT_MIN_UNITS = 28;
/** テキストボックスのタイトル部分の高さ */
const RESUME_TEXT_TITLE_UNITS = 7;
/** テキストボックスの本文1行あたりの高さ */
const RESUME_TEXT_LINE_UNITS = 4.5;
/** テキストボックスの1行あたり文字数 */
const RESUME_TEXT_CHARS_PER_LINE = 42;
/** ミニグリッド（通勤・扶養・配偶者・扶養義務）の高さ */
const RESUME_MINI_UNITS = 28;

/** 配慮事項シート冒頭の説明文の高さ */
const ACCOMMODATION_NOTE_UNITS = 18;
/** 配慮事項シートの「出力項目なし」プレースホルダーの高さ */
const ACCOMMODATION_EMPTY_UNITS = 22;
/** 配慮事項フィールドの最小高さ */
const ACCOMMODATION_FIELD_MIN_UNITS = 29;
/** 配慮事項フィールドのタイトル部分の高さ */
const ACCOMMODATION_FIELD_TITLE_UNITS = 7;
/** 配慮事項フィールドの本文1行あたりの高さ */
const ACCOMMODATION_FIELD_LINE_UNITS = 4.5;
/** 配慮事項フィールドの1行あたり文字数 */
const ACCOMMODATION_FIELD_CHARS_PER_LINE = 46;
/** ASCII文字を全角1文字に換算するときの表示幅比率 */
const HALF_WIDTH_DISPLAY_RATIO = 0.55;
/** テキスト枠内の上下余白に相当する単位 */
const TEXT_CONTENT_PADDING_UNITS = 5;
/** 文末記号まで戻して分割する最小位置（候補チャンク長に対する比率） */
const NATURAL_BREAK_MIN_RATIO = 0.45;

/**
 * 文字列の表示幅を抽象単位で計算する。
 * ASCII文字（コード ≤ 0x7F）= 0.55単位（半角）、それ以外 = 1.0単位（全角）。
 * 印刷時の1行あたり文字数の見積もりに使用。
 */
const countDisplayUnits = (text: string): number =>
  Array.from(text).reduce((total, char) => total + (char.charCodeAt(0) <= 0x7f ? HALF_WIDTH_DISPLAY_RATIO : 1), 0);

const estimateLineCount = (text: string, charsPerLine: number): number => {
  const value = text.trim();
  if (!value) return 1;
  return value
    .split(/\r?\n/)
    .reduce((total, line) => total + Math.max(1, Math.ceil(countDisplayUnits(line) / charsPerLine)), 0);
};

const estimateTableRowUnits = (row: ResumeTableRow): number =>
  Math.max(
    RESUME_TABLE_ROW_MIN_UNITS,
    estimateLineCount(`${row.year} ${row.month} ${row.text}`, RESUME_TABLE_ROW_CHARS_PER_LINE) *
      RESUME_TABLE_ROW_LINE_UNITS,
  );

const estimateResumeTextUnits = (value: string): number =>
  Math.max(
    RESUME_TEXT_MIN_UNITS,
    RESUME_TEXT_TITLE_UNITS +
      estimateLineCount(value, RESUME_TEXT_CHARS_PER_LINE) * RESUME_TEXT_LINE_UNITS +
      TEXT_CONTENT_PADDING_UNITS,
  );

const estimateAccommodationFieldUnits = (value: string): number =>
  Math.max(
    ACCOMMODATION_FIELD_MIN_UNITS,
    ACCOMMODATION_FIELD_TITLE_UNITS +
      estimateLineCount(value, ACCOMMODATION_FIELD_CHARS_PER_LINE) * ACCOMMODATION_FIELD_LINE_UNITS +
      TEXT_CONTENT_PADDING_UNITS,
  );

const findNaturalBreak = (text: string): number => {
  const matches = Array.from(text.matchAll(/[\n。．.!！？?、,，\s]/g));
  return matches.length > 0 ? (matches.at(-1)?.index ?? -1) + 1 : -1;
};

const splitTextToFit = (
  value: string,
  capacityUnits: number,
  estimateUnits: (text: string) => number,
): string[] => {
  let remaining = value.trim();
  if (!remaining) return [''];

  const chunks: string[] = [];
  while (remaining) {
    let low = 1;
    let high = remaining.length;
    let best = 1;

    while (low <= high) {
      const middle = Math.floor((low + high) / 2);
      if (estimateUnits(remaining.slice(0, middle)) <= capacityUnits) {
        best = middle;
        low = middle + 1;
      } else {
        high = middle - 1;
      }
    }

    let chunk = remaining.slice(0, best);
    if (best < remaining.length) {
      const naturalBreak = findNaturalBreak(chunk);
      if (naturalBreak > Math.floor(best * NATURAL_BREAK_MIN_RATIO)) {
        chunk = chunk.slice(0, naturalBreak);
      }
    }

    chunk = chunk.trim();
    if (!chunk) {
      chunk = remaining.slice(0, best);
    }
    chunks.push(chunk);
    remaining = remaining.slice(chunk.length).trimStart();
  }

  return chunks;
};

interface SectionPage<Section> {
  sections: Section[];
}

const createPageBuilder = <Section, Page extends SectionPage<Section>>(
  capacityUnits: number,
  createPage: (pageIndex: number) => Page,
  initialUsedUnits: (page: Page) => number = () => 0,
) => {
  const pages: Page[] = [];
  let currentPage: Page | null = null;
  let usedUnits = 0;

  const startPage = (): Page => {
    const page = createPage(pages.length);
    pages.push(page);
    currentPage = page;
    usedUnits = initialUsedUnits(page);
    return page;
  };

  const remainingUnits = () => capacityUnits - usedUnits - (usedUnits > 0 ? SECTION_GAP_UNITS : 0);

  const addSection = (section: Section, units: number) => {
    let page = currentPage ?? startPage();
    if (usedUnits > 0 && remainingUnits() < units) page = startPage();
    usedUnits += (usedUnits > 0 ? SECTION_GAP_UNITS : 0) + units;
    page.sections.push(section);
  };

  return {
    pages,
    startPage,
    remainingUnits,
    addSection,
    hasUsedUnits: () => usedUnits > 0,
  };
};

export const buildResumePrintPages = (resume: ResumeData): ResumePrintPage[] => {
  const builder = createPageBuilder<ResumePrintSection, ResumePrintPage>(
    RESUME_PAGE_CAPACITY_UNITS,
    (pageIndex) => ({
      id: `resume-${pageIndex + 1}`,
      pageNumber: pageIndex + 1,
      sections: [],
    }),
  );
  const { pages, startPage, remainingUnits, addSection, hasUsedUnits } = builder;

  const addTable = (kind: ResumeTableKind, title: string, rows: ResumeTableRow[]) => {
    if (rows.length === 0) {
      addSection({ type: 'table', kind, title, continued: false, rows: [] }, RESUME_TABLE_HEADER_UNITS);
      return;
    }

    let index = 0;
    let emitted = false;
    while (index < rows.length) {
      if (remainingUnits() < RESUME_TABLE_HEADER_UNITS + RESUME_TABLE_ROW_MIN_UNITS && hasUsedUnits()) {
        startPage();
      }

      const availableForRows = Math.max(0, remainingUnits() - RESUME_TABLE_HEADER_UNITS);
      const chunk: ResumeTableRow[] = [];
      let chunkUnits = 0;

      while (index < rows.length) {
        const rowUnits = estimateTableRowUnits(rows[index]);
        if (chunk.length > 0 && chunkUnits + rowUnits > availableForRows) break;
        chunk.push(rows[index]);
        chunkUnits += rowUnits;
        index += 1;
        if (rowUnits > availableForRows) break;
      }

      if (chunk.length === 0) {
        startPage();
        continue;
      }

      addSection(
        {
          type: 'table',
          kind,
          title,
          continued: emitted,
          rows: chunk,
        },
        RESUME_TABLE_HEADER_UNITS + chunkUnits,
      );
      emitted = true;
    }
  };

  const addTextBox = (kind: ResumeTextKind, title: string, value: string) => {
    const wholeUnits = estimateResumeTextUnits(value);
    if (wholeUnits <= RESUME_PAGE_CAPACITY_UNITS) {
      addSection({ type: 'text', kind, title, continued: false, value }, wholeUnits);
      return;
    }

    const chunks = splitTextToFit(value, RESUME_PAGE_CAPACITY_UNITS, estimateResumeTextUnits);
    chunks.forEach((chunk, index) => {
      addSection(
        {
          type: 'text',
          kind,
          title,
          continued: index > 0,
          value: chunk,
        },
        estimateResumeTextUnits(chunk),
      );
    });
  };

  startPage();
  addSection({ type: 'profile' }, RESUME_PROFILE_UNITS);
  addTable('histories', '学歴・職歴', resume.histories);
  addTable('qualifications', '免許・資格', resume.qualifications);
  addTextBox('motivation', '志望動機', resume.motivation);
  addTextBox('selfPr', '自己PR', resume.selfPr);
  addTextBox('requests', '本人希望欄', resume.requests);
  addSection({ type: 'mini' }, RESUME_MINI_UNITS);

  return pages;
};

export const buildAccommodationPrintPages = (accommodation: AccommodationData): AccommodationPrintPage[] => {
  const fields = getAccommodationPrintFields(accommodation);
  const builder = createPageBuilder<AccommodationPrintSection, AccommodationPrintPage>(
    ACCOMMODATION_PAGE_CAPACITY_UNITS,
    (pageIndex) => ({
      id: `accommodation-${pageIndex + 1}`,
      pageNumber: pageIndex + 1,
      showNote: pageIndex === 0,
      sections: [],
    }),
    (page) => (page.showNote ? ACCOMMODATION_NOTE_UNITS : 0),
  );
  const { pages, startPage, addSection } = builder;

  const addField = (field: PrintField) => {
    const wholeUnits = estimateAccommodationFieldUnits(field.value);
    if (wholeUnits <= ACCOMMODATION_PAGE_CAPACITY_UNITS) {
      addSection({ type: 'field', ...field, continued: false }, wholeUnits);
      return;
    }

    const chunks = splitTextToFit(field.value, ACCOMMODATION_PAGE_CAPACITY_UNITS, estimateAccommodationFieldUnits);
    chunks.forEach((chunk, index) => {
      addSection(
        {
          type: 'field',
          fieldKey: field.fieldKey,
          label: field.label,
          value: chunk,
          sensitive: field.sensitive,
          continued: index > 0,
        },
        estimateAccommodationFieldUnits(chunk),
      );
    });
  };

  startPage();
  if (fields.length === 0) {
    addSection({ type: 'empty' }, ACCOMMODATION_EMPTY_UNITS);
    return pages;
  }

  fields.forEach(addField);
  return pages;
};
