// アプリ共通定数: 写真仕様・JPEG品質・プロジェクトファイルバージョン等の設定値を集約
export const APP_NAME = 'Rirekisho Builder';
export const PROJECT_SCHEMA_VERSION = 1;
export const BYTES_PER_MB = 1024 * 1024;
export const POSTAL_CODE_DIGITS = 7;
/** 志望動機・自己PRの入力上限 */
export const RESUME_APPEAL_MAX_LENGTH = 350;

export const PHOTO_MAX_FILE_SIZE_MB = 10;
export const PHOTO_MAX_FILE_SIZE_BYTES = PHOTO_MAX_FILE_SIZE_MB * BYTES_PER_MB;

export const PHOTO_ACCEPTED_MIME_TYPES = ['image/jpeg'] as const;
export const PHOTO_ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg'] as const;

export const PHOTO_ASPECT_RATIO = 3 / 4;

/** JPEG圧縮品質（0.0〜1.0）。写真処理とPDF出力で共通使用 */
export const JPEG_QUALITY = 0.92;

/** 写真出力の幅（px） */
export const PHOTO_OUTPUT_WIDTH = 900;
/** 写真出力の高さ（px）。PHOTO_ASPECT_RATIO (3:4) から算出 */
export const PHOTO_OUTPUT_HEIGHT = Math.round(PHOTO_OUTPUT_WIDTH / PHOTO_ASPECT_RATIO);
