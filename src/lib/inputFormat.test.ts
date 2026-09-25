import { describe, expect, it } from 'vitest';
import {
  formatPhoneNumberInput,
  formatPostalCodeInput,
  validateEmailInput,
} from './inputFormat';

describe('input formatting', () => {
  it('formats Japanese postal code inputs with hyphens', () => {
    expect(formatPostalCodeInput('1600022')).toEqual({ value: '160-0022', error: '' });
    expect(formatPostalCodeInput('１６０００２２')).toEqual({ value: '160-0022', error: '' });
    expect(formatPostalCodeInput('〒160ー0022')).toEqual({ value: '160-0022', error: '' });
  });

  it('reports postal code format errors', () => {
    expect(formatPostalCodeInput('160')).toEqual({ value: '160', error: '郵便番号は数字7桁で入力してください。' });
    expect(formatPostalCodeInput('abc1600022')).toEqual({ value: 'abc1600022', error: '郵便番号は数字7桁で入力してください。' });
  });

  it('formats Japanese phone number inputs with hyphens', () => {
    expect(formatPhoneNumberInput('09012345678')).toEqual({ value: '090-1234-5678', error: '' });
    expect(formatPhoneNumberInput('0312345678')).toEqual({ value: '03-1234-5678', error: '' });
    expect(formatPhoneNumberInput('0120123456')).toEqual({ value: '0120-123-456', error: '' });
    expect(formatPhoneNumberInput('0421234567')).toEqual({ value: '042-123-4567', error: '' });
  });

  it('reports phone number format errors', () => {
    expect(formatPhoneNumberInput('09012')).toEqual({ value: '09012', error: '電話番号は数字10桁または11桁で入力してください。' });
    expect(formatPhoneNumberInput('090-ABCD-5678')).toEqual({ value: '090-ABCD-5678', error: '電話番号は数字10桁または11桁で入力してください。' });
  });

  it('validates email inputs', () => {
    expect(validateEmailInput('taro.yamada@example.com')).toBe('');
    expect(validateEmailInput('')).toBe('');
    expect(validateEmailInput('invalid@example')).toBe('メールアドレスの形式を確認してください。');
  });
});
