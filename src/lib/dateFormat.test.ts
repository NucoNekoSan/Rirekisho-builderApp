import { describe, expect, it } from 'vitest';
import { calculateAgeFromDateInput, formatDateInputValue } from './dateFormat';

describe('date formatting', () => {
  it('formats date input values in western Japanese format', () => {
    expect(formatDateInputValue('2026-06-26', 'western')).toBe('2026年6月26日');
  });

  it('formats date input values in Japanese era format', () => {
    const formatted = formatDateInputValue('2026-06-26', 'japanese');

    expect(formatted).toContain('令和');
    expect(formatted).toContain('8年');
    expect(formatted).toContain('6月26日');
  });

  it('keeps invalid or partial date values unchanged', () => {
    expect(formatDateInputValue('2026-99-99', 'japanese')).toBe('2026-99-99');
    expect(formatDateInputValue('', 'western')).toBe('');
  });

  it('calculates age on or after the birthday in the current year', () => {
    expect(calculateAgeFromDateInput('1999-05-12', new Date(2026, 4, 12))).toBe('27歳');
    expect(calculateAgeFromDateInput('1999-05-12', new Date(2026, 5, 27))).toBe('27歳');
  });

  it('calculates age before the birthday in the current year', () => {
    expect(calculateAgeFromDateInput('1999-11-04', new Date(2026, 5, 27))).toBe('26歳');
  });

  it('returns blank for invalid, empty, or future birthdates', () => {
    expect(calculateAgeFromDateInput('', new Date(2026, 5, 27))).toBe('');
    expect(calculateAgeFromDateInput('2026-99-99', new Date(2026, 5, 27))).toBe('');
    expect(calculateAgeFromDateInput('2027-01-01', new Date(2026, 5, 27))).toBe('');
  });

  it('handles February 29 birthdays with normal calendar-day comparison', () => {
    expect(calculateAgeFromDateInput('2000-02-29', new Date(2026, 1, 28))).toBe('25歳');
    expect(calculateAgeFromDateInput('2000-02-29', new Date(2026, 2, 1))).toBe('26歳');
  });
});
