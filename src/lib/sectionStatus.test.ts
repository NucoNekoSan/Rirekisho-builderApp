import { describe, expect, it } from 'vitest';
import { createDefaultResume } from './defaults';
import { getResumeSectionStatus, sectionStatusClass } from './sectionStatus';

describe('getResumeSectionStatus', () => {
  it('keeps basic information incomplete until required identity and contact fields are filled', () => {
    const resume = createDefaultResume();

    expect(getResumeSectionStatus('basic', resume, false)).toBe('未入力あり');

    resume.basic.name = '山田 太郎';
    resume.basic.furigana = 'やまだ たろう';
    resume.basic.birthDate = '1999-05-12';
    resume.basic.address = '東京都新宿区1-2-3';
    resume.basic.email = 'taro@example.com';

    expect(getResumeSectionStatus('basic', resume, false)).toBe('入力済み');
  });

  it('requires dated history rows before marking history complete', () => {
    const resume = createDefaultResume();

    expect(getResumeSectionStatus('history', resume, false)).toBe('未入力あり');

    resume.histories[0] = {
      ...resume.histories[0],
      year: '2018',
      month: '4',
    };

    expect(getResumeSectionStatus('history', resume, false)).toBe('入力済み');
  });

  it('marks accommodation as out of scope for general applications', () => {
    const resume = createDefaultResume();

    expect(getResumeSectionStatus('accommodation', resume, false)).toBe('対象外');

    resume.applicationType = 'disability';

    expect(getResumeSectionStatus('accommodation', resume, false)).toBe('未入力あり');
    expect(getResumeSectionStatus('accommodation', resume, true)).toBe('入力済み');
  });

  it('maps statuses to visual state classes', () => {
    expect(sectionStatusClass('入力済み')).toBe('complete');
    expect(sectionStatusClass('未入力あり')).toBe('warning');
    expect(sectionStatusClass('任意')).toBe('neutral');
  });
});
