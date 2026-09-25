// 配慮事項シートのPDF出力データ組み立て: include*フラグに従い出力対象フィールドを抽出する
import type { AccommodationData } from './types';

type AccommodationPrintFieldKey =
  | 'disabilityName'
  | 'certificate'
  | 'hospitalVisit'
  | 'medication'
  | 'supportContact'
  | 'strengths'
  | 'difficultSituations'
  | 'requestedAccommodations'
  | 'selfCare'
  | 'warningSigns';

export interface PrintField {
  fieldKey: AccommodationPrintFieldKey;
  label: string;
  value: string;
  sensitive: boolean;
}

type SensitiveField = readonly [
  fieldKey: AccommodationPrintFieldKey,
  label: string,
  enabled: boolean,
  value: string,
];

const getSensitiveFields = (data: AccommodationData): SensitiveField[] => [
  ['disabilityName', '障害名・診断名', data.includeDisabilityName, data.disabilityName],
  ['certificate', '障害者手帳等', data.includeCertificate, data.certificate],
  ['hospitalVisit', '通院状況', data.includeHospitalVisit, data.hospitalVisit],
  ['medication', '服薬・体調管理', data.includeMedication, data.medication],
  ['supportContact', '支援機関・連絡先', data.includeSupportContact, data.supportContact],
];

export const getAccommodationPrintFields = (data: AccommodationData): PrintField[] => {
  const fields: PrintField[] = [];
  for (const [fieldKey, label, enabled, value] of getSensitiveFields(data)) {
    if (enabled && value.trim()) fields.push({ fieldKey, label, value: value.trim(), sensitive: true });
  }

  const alwaysFields: Array<[AccommodationPrintFieldKey, string, string]> = [
    ['strengths', '得意なこと・強み', data.strengths],
    ['difficultSituations', '苦手な環境・状況', data.difficultSituations],
    ['requestedAccommodations', 'お願いしたい配慮', data.requestedAccommodations],
    ['selfCare', '自分で行っている工夫', data.selfCare],
    ['warningSigns', '体調悪化時のサイン', data.warningSigns],
  ];
  for (const [fieldKey, label, value] of alwaysFields) {
    if (value.trim()) fields.push({ fieldKey, label, value: value.trim(), sensitive: false });
  }
  return fields;
};

export const hasSensitiveAccommodationOutput = (data: AccommodationData): boolean =>
  getSensitiveFields(data).some(([, , enabled, value]) => enabled && value.trim().length > 0);
