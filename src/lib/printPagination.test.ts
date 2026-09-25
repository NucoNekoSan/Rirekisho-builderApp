import { describe, expect, it } from 'vitest';
import {
  createDefaultAccommodation,
  createDefaultResume,
  createDisabilityEmploymentDemoState,
  createGeneralDemoState,
} from './defaults';
import { buildAccommodationPrintPages, buildResumePrintPages } from './printPagination';
import type {
  AccommodationPrintSection,
  ResumePrintSection,
  ResumeTableSection,
  ResumeTextSection,
} from './printPagination';
import type { HistoryEntry, QualificationEntry } from './types';

type AccommodationFieldSection = Extract<AccommodationPrintSection, { type: 'field' }>;

const isResumeTableSection = (section: ResumePrintSection): section is ResumeTableSection =>
  section.type === 'table';

const isResumeTextSection = (section: ResumePrintSection): section is ResumeTextSection =>
  section.type === 'text';

const isAccommodationFieldSection = (section: AccommodationPrintSection): section is AccommodationFieldSection =>
  section.type === 'field';

const historyRows = (count: number): HistoryEntry[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `history-${index + 1}`,
    year: '2026',
    month: '4',
    text: `学歴・職歴 ${index + 1}`,
  }));

const qualificationRows = (count: number): QualificationEntry[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `qualification-${index + 1}`,
    year: '2026',
    month: '4',
    text: `免許・資格 ${index + 1}`,
  }));

describe('buildResumePrintPages', () => {
  it('学歴・職歴を行単位で複数ページへ分割し、続きページ扱いにする', () => {
    const resume = createDefaultResume();
    resume.histories = historyRows(42);
    resume.qualifications = [];

    const sections = buildResumePrintPages(resume)
      .flatMap((page) => page.sections)
      .filter(isResumeTableSection)
      .filter((section) => section.kind === 'histories');

    expect(sections.length).toBeGreaterThan(1);
    expect(sections[0].continued).toBe(false);
    expect(sections.slice(1).every((section) => section.continued)).toBe(true);
    expect(sections.flatMap((section) => section.rows.map((row) => row.id))).toEqual(
      resume.histories.map((row) => row.id),
    );
  });

  it('免許・資格を学歴・職歴とは別セクションとして分割し、続きページ扱いにする', () => {
    const resume = createDefaultResume();
    resume.histories = historyRows(2);
    resume.qualifications = qualificationRows(50);

    const sections = buildResumePrintPages(resume)
      .flatMap((page) => page.sections)
      .filter(isResumeTableSection)
      .filter((section) => section.kind === 'qualifications');

    expect(sections.length).toBeGreaterThan(1);
    expect(sections[0].continued).toBe(false);
    expect(sections.slice(1).every((section) => section.continued)).toBe(true);
    expect(sections.every((section) => section.title === '免許・資格')).toBe(true);
    expect(sections.flatMap((section) => section.rows.map((row) => row.id))).toEqual(
      resume.qualifications.map((row) => row.id),
    );
  });

  it('A4を超える長文欄だけを続き付きで分割する', () => {
    const resume = createDefaultResume();
    resume.histories = [];
    resume.qualifications = [];
    resume.motivation = '応募理由。'.repeat(900);

    const sections = buildResumePrintPages(resume)
      .flatMap((page) => page.sections)
      .filter(isResumeTextSection)
      .filter((section) => section.kind === 'motivation');

    expect(sections.length).toBeGreaterThan(1);
    expect(sections[0].continued).toBe(false);
    expect(sections.slice(1).every((section) => section.continued)).toBe(true);
    expect(sections.map((section) => section.value).join('')).toBe(resume.motivation);
  });

  it('一般応募サンプルでは自己PRを1ページ目の下端に詰め込まない', () => {
    const { resume } = createGeneralDemoState();
    const pages = buildResumePrintPages(resume);

    expect(pages.length).toBeGreaterThan(1);
    expect(pages[0].sections.some((section) => section.type === 'text' && section.kind === 'selfPr')).toBe(false);
    expect(pages[1].sections.some((section) => section.type === 'text' && section.kind === 'selfPr')).toBe(true);
  });

  it('障害者雇用デモの350文字欄をA4縦2ページに収める', () => {
    const { resume, accommodation } = createDisabilityEmploymentDemoState();
    const pages = buildResumePrintPages(resume);

    expect(resume.applicationType).toBe('disability');
    expect(resume.histories).toHaveLength(18);
    expect(resume.motivation).toHaveLength(350);
    expect(resume.selfPr).toHaveLength(350);
    expect(pages).toHaveLength(2);
    expect(buildAccommodationPrintPages(accommodation)).toHaveLength(2);
  });
});

describe('buildAccommodationPrintPages', () => {
  it('配慮事項の長文項目を続き付きで分割する', () => {
    const accommodation = createDefaultAccommodation();
    accommodation.strengths = '強み。'.repeat(1000);

    const sections = buildAccommodationPrintPages(accommodation)
      .flatMap((page) => page.sections)
      .filter(isAccommodationFieldSection)
      .filter((section) => section.label === '得意なこと・強み');

    expect(sections.length).toBeGreaterThan(1);
    expect(sections[0].continued).toBe(false);
    expect(sections.slice(1).every((section) => section.continued)).toBe(true);
    expect(sections.map((section) => section.value).join('')).toBe(accommodation.strengths);
  });
});
