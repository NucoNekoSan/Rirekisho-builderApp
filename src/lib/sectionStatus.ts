// 左メニューのセクション完了状態判定: 各セクションの入力充足度を「入力済み/未入力あり/任意/対象外」で返す
import { calculateAgeFromDateInput } from './dateFormat';
import type { HistoryEntry, QualificationEntry, ResumeData } from './types';

type ResumeSectionId = 'basic' | 'photo' | 'history' | 'license' | 'appeal' | 'accommodation' | 'output';
export type SectionStatus = '入力済み' | '未入力あり' | '任意' | '対象外' | '確認';

const hasAnyText = (...values: string[]) => values.some((value) => value.trim().length > 0);
const hasAllText = (...values: string[]) => values.every((value) => value.trim().length > 0);

const hasCompleteDatedRow = (rows: Array<HistoryEntry | QualificationEntry>) =>
  rows.some((row) => hasAllText(row.year, row.month, row.text));

export const getResumeSectionStatus = (
  sectionId: ResumeSectionId,
  resume: ResumeData,
  hasAccommodationOutput: boolean,
): SectionStatus => {
  switch (sectionId) {
    case 'basic':
      return hasAllText(resume.basic.name, resume.basic.furigana, resume.basic.birthDate, calculateAgeFromDateInput(resume.basic.birthDate, new Date()), resume.basic.address) &&
        hasAnyText(resume.basic.phone, resume.basic.email)
        ? '入力済み'
        : '未入力あり';
    case 'photo':
      return resume.photo ? '入力済み' : '任意';
    case 'history':
      return hasCompleteDatedRow(resume.histories) ? '入力済み' : '未入力あり';
    case 'license':
      return hasCompleteDatedRow(resume.qualifications) ? '入力済み' : '任意';
    case 'appeal':
      return hasAllText(resume.motivation, resume.selfPr, resume.requests) ? '入力済み' : '未入力あり';
    case 'accommodation':
      if (resume.applicationType !== 'disability') return '対象外';
      return hasAccommodationOutput ? '入力済み' : '未入力あり';
    case 'output':
      return '確認';
    default:
      return '未入力あり';
  }
};

export const sectionStatusClass = (status: SectionStatus) => {
  if (status === '入力済み') return 'complete';
  if (status === '未入力あり') return 'warning';
  return 'neutral';
};
