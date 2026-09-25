// 入力値の整形とバリデーション: 郵便番号・電話番号のハイフン自動挿入、メールアドレス形式チェック
import { extractDigits, normalizeNfkc } from './textNormalize';
import { POSTAL_CODE_DIGITS } from './config';

interface FieldFormatResult {
  value: string;
  error: string;
}

const normalizeText = (value: string): string => normalizeNfkc(value).trim();
const digitsOnly = (value: string): string => extractDigits(value);
const POSTAL_CODE_ERROR = `郵便番号は数字${POSTAL_CODE_DIGITS}桁で入力してください。`;
const PHONE_NUMBER_ERROR = '電話番号は数字10桁または11桁で入力してください。';
const MOBILE_PHONE_DIGITS = 11;
const LANDLINE_PHONE_DIGITS = 10;
const TOLL_FREE_PREFIX = '0120';
const TWO_DIGIT_AREA_CODES = ['03', '06'] as const;

const hasUnexpectedPostalCharacters = (value: string): boolean =>
  /[^0-9\s\-ー－―〒]/.test(normalizeText(value));

const hasUnexpectedPhoneCharacters = (value: string): boolean =>
  /[^0-9\s\-ー－―]/.test(normalizeText(value));

export const formatPostalCodeInput = (value: string): FieldFormatResult => {
  if (value.trim().length === 0) return { value: '', error: '' };
  if (hasUnexpectedPostalCharacters(value)) {
    return { value, error: POSTAL_CODE_ERROR };
  }

  const digits = digitsOnly(value);
  if (digits.length !== POSTAL_CODE_DIGITS) {
    return { value, error: POSTAL_CODE_ERROR };
  }

  return { value: `${digits.slice(0, 3)}-${digits.slice(3)}`, error: '' };
};

export const formatPostalCodeForDisplay = (value: string): string => {
  const formatted = formatPostalCodeInput(value);
  return formatted.error ? value : formatted.value;
};

export const formatPhoneNumberInput = (value: string): FieldFormatResult => {
  if (value.trim().length === 0) return { value: '', error: '' };
  if (hasUnexpectedPhoneCharacters(value)) {
    return { value, error: PHONE_NUMBER_ERROR };
  }

  const digits = digitsOnly(value);
  if (digits.length === MOBILE_PHONE_DIGITS) {
    return { value: `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`, error: '' };
  }

  if (digits.length === LANDLINE_PHONE_DIGITS) {
    if (digits.startsWith(TOLL_FREE_PREFIX)) {
      return { value: `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`, error: '' };
    }

    if (TWO_DIGIT_AREA_CODES.some((areaCode) => digits.startsWith(areaCode))) {
      return { value: `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`, error: '' };
    }

    return { value: `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`, error: '' };
  }

  return { value, error: PHONE_NUMBER_ERROR };
};

export const formatPhoneNumberForDisplay = (value: string): string => {
  const formatted = formatPhoneNumberInput(value);
  return formatted.error ? value : formatted.value;
};

export const validateEmailInput = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed.length === 0) return '';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? '' : 'メールアドレスの形式を確認してください。';
};
