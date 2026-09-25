// 日付フォーマット: 西暦・和暦の表示変換と、生年月日からの年齢計算
import type { EraMode } from './types';

const westernFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const japaneseFormatter = new Intl.DateTimeFormat('ja-JP-u-ca-japanese', {
  era: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const parseDateInputValue = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
};

export const formatDate = (date: Date, eraMode: EraMode): string =>
  eraMode === 'japanese' ? japaneseFormatter.format(date) : westernFormatter.format(date);

export const formatDateInputValue = (value: string, eraMode: EraMode): string => {
  const date = parseDateInputValue(value);
  return date ? formatDate(date, eraMode) : value;
};

export const calculateAgeFromDateInput = (birthDateValue: string, asOfDate: Date): string => {
  const birthDate = parseDateInputValue(birthDateValue);
  if (!birthDate || Number.isNaN(asOfDate.getTime())) return '';

  const year = asOfDate.getFullYear();
  const month = asOfDate.getMonth();
  const day = asOfDate.getDate();
  const birthdayPassed =
    month > birthDate.getMonth() || (month === birthDate.getMonth() && day >= birthDate.getDate());
  const age = year - birthDate.getFullYear() - (birthdayPassed ? 0 : 1);

  return age >= 0 ? `${age}歳` : '';
};
