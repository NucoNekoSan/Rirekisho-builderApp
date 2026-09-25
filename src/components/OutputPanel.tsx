// 保存・PDF出力パネル: PDF様式選択、入力データJSON保存・読込、データ初期化のUI
import type { ChangeEvent } from 'react';
import { hasSensitiveAccommodationOutput } from '../lib/accommodation';
import { RESUME_APPEAL_MAX_LENGTH } from '../lib/config';
import type {
  AccommodationData,
  PdfFontFamily,
  PdfPaperFormat,
  ResumeData,
} from '../lib/types';

const pdfFontOptions: Array<{ value: PdfFontFamily; label: string }> = [
  { value: 'mincho', label: '明朝（フォーマル）' },
  { value: 'gothic', label: 'ゴシック（読みやすい）' },
];

const pdfPaperOptions: Array<{ value: PdfPaperFormat; label: string }> = [
  { value: 'a4-portrait', label: 'A4縦（標準）' },
  { value: 'a3-landscape', label: 'A3横（1枚）' },
];

interface OutputPanelProps {
  resume: ResumeData;
  accommodation: AccommodationData;
  resumePaperFormatLabel: string;
  resumeA4PageCount: number;
  resumeA4PageWarning: boolean;
  resumeA3DensityWarning: boolean;
  resumeAppealLengthWarning: string;
  accommodationFieldCount: number;
  accommodationA4PageCount: number;
  accommodationPageWarning: boolean;
  includePhotoInProject: boolean;
  setIncludePhotoInProject: (value: boolean) => void;
  updateResumeField: <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => void;
  applyDisabilityEmploymentDemo: (paperFormat: PdfPaperFormat) => void;
  saveProject: () => void;
  loadProject: (event: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}

export function OutputPanel({
  resume,
  accommodation,
  resumePaperFormatLabel,
  resumeA4PageCount,
  resumeA4PageWarning,
  resumeA3DensityWarning,
  resumeAppealLengthWarning,
  accommodationFieldCount,
  accommodationA4PageCount,
  accommodationPageWarning,
  includePhotoInProject,
  setIncludePhotoInProject,
  updateResumeField,
  applyDisabilityEmploymentDemo,
  saveProject,
  loadProject,
  onClear,
}: OutputPanelProps) {
  const resumePaperFormat = resume.pdfPaperFormat;
  return (
    <div className="output-grid">
      <div className="output-card output-card-wide">
        <h3>PDF出力前確認</h3>
        <ul className="check-list">
          <li>一般応募PDFには配慮事項シートの内容を含めません。</li>
          <li>作業メモはPDFに出力しません。</li>
          <li>{`履歴書は${resumePaperFormatLabel}形式で出力します。`}</li>
          {resumePaperFormat === 'a4-portrait' ? (
            <li>A4縦は履歴書2ページまでを標準にしています。</li>
          ) : (
            <li>A3横は履歴書を1枚にまとめる形式です。</li>
          )}
          {resumeA4PageWarning ? <li className="warning-text">{`現在の入力量はA4縦2ページに収まらないため、PDFを表示・保存できません（容量目安: ${resumeA4PageCount}ページ）。内容を短くするか、A3横を選択してください。`}</li> : null}
          {resumeA3DensityWarning ? <li className="warning-text">A3横1枚では内容が収まりきらない可能性があります。A4縦も比較して確認してください。</li> : null}
          {resumeAppealLengthWarning ? <li className="warning-text">{`${resumeAppealLengthWarning} ${RESUME_APPEAL_MAX_LENGTH}文字以内になるまでPDFを表示・保存できません。`}</li> : null}
          {resume.applicationType === 'disability' ? (
            <>
              <li>配慮事項シートはA4縦形式で出力します。</li>
              <li>{`配慮事項シートの出力項目: ${accommodationFieldCount}件`}</li>
              {accommodationPageWarning ? <li className="warning-text">{`配慮事項シートが${accommodationA4PageCount}ページになります。A4縦1ページを超える場合は内容量を確認してください。`}</li> : null}
              {hasSensitiveAccommodationOutput(accommodation) ? <li className="warning-text">配慮事項シートに機微情報が含まれます。</li> : null}
            </>
          ) : (
            <li>応募種別が一般応募のため配慮事項シートは出力しません。</li>
          )}
        </ul>
        <fieldset className="field choice-field pdf-paper-control">
          <legend>PDF様式</legend>
          <div className="segmented-radios pdf-paper-options">
            {pdfPaperOptions.map((option) => (
              <label key={option.value}>
                <input
                  type="radio"
                  name="pdfPaperFormat"
                  checked={resumePaperFormat === option.value}
                  onChange={() => updateResumeField('pdfPaperFormat', option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
          <p className="paper-format-note">
            {resumePaperFormat === 'a3-landscape'
              ? '履歴書だけをA3横1枚で出力します。障害者雇用応募の配慮事項シートはA4縦の別紙です。'
              : '履歴書をA4縦で出力します。障害者雇用応募では配慮事項シートをA4縦の別紙で追加します。'}
          </p>
        </fieldset>
        <fieldset className="field choice-field pdf-font-control">
          <legend>PDF書体</legend>
          <div className="segmented-radios pdf-font-options">
            {pdfFontOptions.map((option) => (
              <label key={option.value}>
                <input
                  type="radio"
                  name="pdfFontFamily"
                  checked={resume.pdfFontFamily === option.value}
                  onChange={() => updateResumeField('pdfFontFamily', option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="demo-check-action">
          <p>確認用デモとして、障害者雇用応募の履歴書と配慮事項を入力できます。</p>
          <div className="demo-check-buttons">
            <button type="button" className="secondary" onClick={() => applyDisabilityEmploymentDemo('a4-portrait')}>A4縦・障害者雇用デモを入力</button>
            <button type="button" className="secondary" onClick={() => applyDisabilityEmploymentDemo('a3-landscape')}>A3横・障害者雇用デモを入力</button>
          </div>
        </div>
        <p className="output-guidance">右側のPDFプレビューで内容を確認し、PDFを表示・保存してください。</p>
      </div>
      <div className="output-card">
        <h3>入力データ保存</h3>
        <p>入力内容をJSONファイルとして保存し、後からこの画面に読み込めます。</p>
        {resume.applicationType === 'disability' ? (
          <p className="warning-text">障害者雇用応募では、配慮事項シートの入力内容も入力データに含まれます。</p>
        ) : (
          <p>一般応募では、配慮事項シートの入力内容は入力データに含めません。</p>
        )}
        <label className="check-row"><input type="checkbox" checked={includePhotoInProject} onChange={(event) => setIncludePhotoInProject(event.target.checked)} />写真も入力データに含める</label>
        {includePhotoInProject ? <p className="warning-text">写真がJSONファイルに含まれます。共有PCや共有フォルダでの扱いに注意してください。</p> : <p>既定では写真を入力データに含めません。</p>}
        <div className="button-row">
          <button type="button" onClick={saveProject}>入力データを保存</button>
          <label className="file-button secondary">入力データを読込<input type="file" accept="application/json,.json" onChange={loadProject} /></label>
        </div>
      </div>
      <div className="output-card danger-zone">
        <h3>データ初期化</h3>
        <p>保存していない入力内容、取り込んだ写真、作成中の配慮事項をこの画面から消します。</p>
        <div className="button-row">
          <button type="button" className="danger" onClick={onClear}>入力をすべて消去</button>
        </div>
      </div>
    </div>
  );
}
