import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createDefaultAccommodation, createDefaultResume, createDisabilityEmploymentDemoState } from '../lib/defaults';
import { AccommodationPage, ResumeA3Page, ResumePage } from './PdfPages';

describe('ResumePage', () => {
  it('uses A4 portrait resume pages', () => {
    const resume = createDefaultResume();

    const { container } = render(<ResumePage resume={resume} />);

    expect(container.querySelectorAll('.pdf-page.resume-page')).toHaveLength(2);
    expect(container.querySelector('.resume-a4-page-1')).toBeInTheDocument();
    expect(container.querySelector('.resume-a4-page-2')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: '履歴書' })).toHaveLength(1);
    expect(container.querySelector('.resume-a4-page-2 .resume-title-row')).toBeNull();
    expect(container.querySelector('.resume-a4-page-2 .resume-a4-page-number')).toHaveTextContent('2/2');
    expect(screen.getAllByRole('heading', { name: '学歴・職歴' })).toHaveLength(2);
    expect(screen.getByRole('heading', { name: '免許・資格' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '学歴・職歴（続き）' })).not.toBeInTheDocument();
  });

  it('applies selected PDF font classes to resume and accommodation pages', () => {
    const resume = createDefaultResume();
    const accommodation = createDefaultAccommodation();

    const { container, rerender } = render(<ResumePage resume={resume} />);

    expect(container.querySelector('.resume-document')).toHaveClass('pdf-font-mincho');

    resume.pdfFontFamily = 'gothic';
    rerender(<ResumePage resume={resume} />);

    expect(container.querySelector('.resume-document')).toHaveClass('pdf-font-gothic');

    rerender(<AccommodationPage accommodation={accommodation} pdfFontFamily="mincho" />);

    expect(container.querySelector('.accommodation-document')).toHaveClass('pdf-font-mincho');
  });

  it('splits overflowing histories between the two fixed A4 pages', () => {
    const resume = createDefaultResume();
    resume.histories = Array.from({ length: 42 }, (_, index) => ({
      id: `history-${index + 1}`,
      year: '2026',
      month: '4',
      text: `学歴・職歴 ${index + 1}`,
    }));

    const { container } = render(<ResumePage resume={resume} />);
    const primaryTable = container.querySelector<HTMLTableElement>('.resume-a4-history-primary-area table');
    const secondaryTable = container.querySelector<HTMLTableElement>('.resume-a4-history-secondary-area table');

    expect(container.querySelectorAll('.pdf-page.resume-page')).toHaveLength(2);
    expect(primaryTable?.querySelectorAll('tbody tr:not(.print-empty-row)')).toHaveLength(21);
    expect(secondaryTable?.querySelectorAll('tbody tr:not(.print-empty-row)')).toHaveLength(42 - 21);
    expect(container.querySelectorAll('.resume-a4-history-block tbody tr:not(.print-empty-row)')).toHaveLength(42);
  });

  it('renders the A3 landscape resume as a single dedicated page', () => {
    const resume = createDefaultResume();
    resume.histories = [
      { id: 'history-1', year: '2026', month: '4', text: '株式会社サンプル 入社' },
      { id: 'history-2', year: '', month: '', text: '以上' },
    ];

    const { container } = render(<ResumeA3Page resume={resume} />);

    expect(container.querySelector('.resume-a3-document')).toBeInTheDocument();
    expect(container.querySelectorAll('.pdf-page.resume-a3-page')).toHaveLength(1);
    expect(container.querySelector('.resume-a3-left-face')).toBeInTheDocument();
    expect(container.querySelector('.resume-a3-right-face')).toBeInTheDocument();
    expect(container.querySelector('.resume-a3-history-primary-area')).toBeInTheDocument();
    expect(container.querySelector('.resume-a3-history-secondary-area')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: '学歴・職歴' })).toHaveLength(2);
    expect(screen.getByRole('heading', { name: '免許・資格' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '学歴・職歴（続き）' })).not.toBeInTheDocument();
  });

  it('renders the disability-employment demo histories on the A3 sheet in order', () => {
    const { resume } = createDisabilityEmploymentDemoState();

    const { container } = render(<ResumeA3Page resume={resume} />);
    const primaryHistoryRows = Math.min(22, resume.histories.length);
    const primaryHistoryTable = container.querySelector<HTMLTableElement>('.resume-a3-history-primary-area table');
    const secondaryHistoryTable = container.querySelector<HTMLTableElement>('.resume-a3-history-secondary-area table');

    expect(container.querySelectorAll('.pdf-page.resume-a3-page')).toHaveLength(1);
    expect(container.querySelectorAll('.resume-a3-history-block')).toHaveLength(2);
    expect(primaryHistoryTable).toBeInTheDocument();
    expect(secondaryHistoryTable).toBeInTheDocument();
    expect(container.querySelectorAll('.resume-a3-history-block tbody tr:not(.print-empty-row)')).toHaveLength(resume.histories.length);
    expect(primaryHistoryTable?.querySelectorAll('tbody tr:not(.print-empty-row)')).toHaveLength(primaryHistoryRows);
    expect(secondaryHistoryTable?.querySelectorAll('tbody tr:not(.print-empty-row)')).toHaveLength(resume.histories.length - primaryHistoryRows);
    expect(primaryHistoryTable?.querySelector('tbody tr:not(.print-empty-row)')).toHaveTextContent('東京都立若葉高等学校 普通科 入学');
    expect(primaryHistoryTable).toHaveTextContent('体調調整のため退職');
    expect(primaryHistoryTable).toHaveTextContent('以上');
    expect(secondaryHistoryTable?.querySelector('tbody tr:not(.print-empty-row)')).toBeNull();
    expect(secondaryHistoryTable?.querySelectorAll('tbody tr')).toHaveLength(7);
    expect(screen.getAllByRole('heading', { name: '学歴・職歴' })).toHaveLength(2);
    expect(screen.queryByRole('heading', { name: '学歴・職歴（続き）' })).not.toBeInTheDocument();
    expect(screen.getByText('株式会社アオバ商事 入社 販売補助として勤務')).toBeInTheDocument();
    expect(screen.getByText('以上')).toBeInTheDocument();
  });

  it('keeps gender and commute fields in fixed resume cells', () => {
    const resume = createDefaultResume();
    resume.basic.birthDate = '1999-05-12';
    resume.basic.age = '99歳';
    resume.basic.gender = 'male';
    resume.basic.name = '山田 太郎';
    resume.textAlignments['basic.name'] = 'center';
    resume.textAlignments['basic.age'] = 'right';
    resume.commuteTime = '約45分';
    resume.dependents = '0人';
    resume.spouse = '無';
    resume.spouseSupport = '無';
    resume.textAlignments['resume.commuteTime'] = 'center';

    const { container } = render(<ResumePage resume={resume} printDate={new Date(2026, 5, 27)} />);

    expect(screen.getByText('山田 太郎')).toHaveClass('align-center');
    const birthAgeGenderRow = container.querySelector('.birth-age-gender-row');
    expect(birthAgeGenderRow).toBeInTheDocument();
    expect(birthAgeGenderRow).toHaveTextContent('生年月日');
    expect(birthAgeGenderRow).toHaveTextContent('年齢');
    expect(birthAgeGenderRow).toHaveTextContent('27歳');
    expect(birthAgeGenderRow).not.toHaveTextContent('99歳');
    expect(screen.getByText('27歳')).toHaveClass('align-right');
    expect(birthAgeGenderRow).toHaveTextContent('性別');
    expect(birthAgeGenderRow).toHaveTextContent('男性');

    const miniGrid = container.querySelector('.resume-mini-grid');
    expect(miniGrid).toBeInTheDocument();
    expect(miniGrid?.querySelectorAll('p')).toHaveLength(4);
    expect(miniGrid?.querySelectorAll('strong')).toHaveLength(4);
    expect(screen.getByText('約45分')).toHaveClass('align-center');
    expect(screen.getByText('扶養家族')).toBeInTheDocument();
  });

  it('formats postal codes and phone numbers for PDF output', () => {
    const resume = createDefaultResume();
    resume.basic.postalCode = '1600022';
    resume.basic.address = '東京都新宿区新宿1-2-3';
    resume.basic.phone = '09012345678';
    resume.basic.contactPostalCode = '1600023';
    resume.basic.contactAddress = '東京都新宿区西新宿1-2-3';
    resume.basic.contactPhone = '0312345678';

    render(<ResumePage resume={resume} />);

    expect(screen.getByText(/〒160-0022/)).toBeInTheDocument();
    expect(screen.getByText('090-1234-5678')).toBeInTheDocument();
    expect(screen.getByText(/〒160-0023/)).toBeInTheDocument();
    expect(screen.getByText('03-1234-5678')).toBeInTheDocument();
  });

  it('applies text alignment to table and text sections', () => {
    const resume = createDefaultResume();
    resume.histories = [{ id: 'history-1', year: '2026', month: '4', text: '株式会社サンプル 入社' }];
    resume.motivation = '応募理由です。';
    resume.textAlignments['histories.history-1.text'] = 'right';
    resume.textAlignments['resume.motivation'] = 'center';

    render(<ResumePage resume={resume} />);

    expect(screen.getByText('株式会社サンプル 入社')).toHaveClass('align-right');
    expect(screen.getByText('応募理由です。')).toHaveClass('align-center');
  });
});
