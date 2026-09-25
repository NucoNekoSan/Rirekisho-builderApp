// アプリ全体で共有する型定義（データ構造・設定値の型）

/** 応募種別: 一般応募 / 障害者雇用応募 */
type ApplicationType = 'general' | 'disability';
/** 入力モード（現在は standard のみ。将来の拡張用） */
type InputMode = 'standard';
/** PDF日付表示: 西暦 / 和暦 */
export type EraMode = 'western' | 'japanese';
/** 性別選択肢: 未選択 / 女性 / 男性 / 回答しない / PDFに非表示 */
export type GenderOption = '' | 'female' | 'male' | 'no_answer' | 'hidden';
/** PDF上のテキスト配置（書式設定パネルで制御） */
export type TextAlignment = 'left' | 'center' | 'right';
/** フィールドごとのテキスト配置マップ（キー: "basic.name" 等のドットパス） */
export type TextAlignmentMap = Record<string, TextAlignment>;
/** PDF書体: ゴシック / 明朝 */
export type PdfFontFamily = 'gothic' | 'mincho';
/** PDF用紙: A4縦2ページ / A3横1枚 */
export type PdfPaperFormat = 'a4-portrait' | 'a3-landscape';

/** 基本情報（氏名・住所・連絡先） */
export interface BasicInfo {
  name: string;
  furigana: string;
  /** HTML date input 形式 "YYYY-MM-DD" */
  birthDate: string;
  /** 自動計算された年齢テキスト（例: "27歳"） */
  age: string;
  gender: GenderOption;
  postalCode: string;
  address: string;
  phone: string;
  email: string;
  /** 連絡先が現住所と異なる場合の郵便番号 */
  contactPostalCode: string;
  contactAddress: string;
  contactPhone: string;
}

/** 年月と内容を持つ一覧行 */
export interface DatedEntry {
  id: string;
  year: string;
  month: string;
  text: string;
}

/** 学歴・職歴の1行 */
export type HistoryEntry = DatedEntry;
/** 免許・資格の1行 */
export type QualificationEntry = DatedEntry;

/** 取り込み済み写真データ（Base64 Data URL） */
export interface PhotoData {
  dataUrl: string;
  fileName: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  updatedAt: string;
}

/** 履歴書データ全体（基本情報＋学歴職歴＋志望動機＋写真＋設定） */
export interface ResumeData {
  applicationType: ApplicationType;
  inputMode: InputMode;
  eraMode: EraMode;
  pdfFontFamily: PdfFontFamily;
  pdfPaperFormat: PdfPaperFormat;
  createdAt: string;
  updatedAt: string;
  basic: BasicInfo;
  histories: HistoryEntry[];
  qualifications: QualificationEntry[];
  commuteTime: string;
  dependents: string;
  spouse: string;
  spouseSupport: string;
  motivation: string;
  selfPr: string;
  requests: string;
  /** 作業メモ（PDFには出力しない） */
  memo: string;
  photo: PhotoData | null;
  textAlignments: TextAlignmentMap;
}

/** 配慮事項シートデータ（障害者雇用応募時のみ使用） */
export interface AccommodationData {
  /** 以下の include* フラグがONの項目だけPDFに出力される */
  includeDisabilityName: boolean;
  disabilityName: string;
  includeCertificate: boolean;
  certificate: string;
  includeHospitalVisit: boolean;
  hospitalVisit: string;
  includeMedication: boolean;
  medication: string;
  includeSupportContact: boolean;
  supportContact: string;
  /** 以下は常にPDF出力対象（入力があれば） */
  strengths: string;
  difficultSituations: string;
  requestedAccommodations: string;
  selfCare: string;
  warningSigns: string;
  textAlignments: TextAlignmentMap;
}

/** アプリ全体のstate（履歴書＋配慮事項） */
export interface AppState {
  resume: ResumeData;
  accommodation: AccommodationData;
}

/** JSON保存ファイルの構造 */
export interface ProjectFile {
  schemaVersion: number;
  exportedAt: string;
  app: string;
  includePhoto: boolean;
  includeAccommodation: boolean;
  state: AppState;
}
