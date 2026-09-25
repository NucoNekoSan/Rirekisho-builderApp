import type { KeyboardEvent } from 'react';
import { TextAlignmentControl } from './FormFields';
import { getTextAlignment } from '../lib/alignment';
import type { HistoryEntry, QualificationEntry, TextAlignment, TextAlignmentMap } from '../lib/types';

export function EditableRows<T extends HistoryEntry | QualificationEntry>({
  rows,
  groupLabel,
  onChange,
  onAdd,
  onRemove,
  onMove,
  addLabel,
  alignmentKind,
  alignments,
  onAlignmentChange,
  showAlignmentControls,
  onKeyDown,
}: {
  rows: T[];
  groupLabel: string;
  onChange: (id: string, patch: Partial<T>) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  addLabel: string;
  alignmentKind: 'histories' | 'qualifications';
  alignments: TextAlignmentMap;
  onAlignmentChange: (key: string, alignment: TextAlignment) => void;
  showAlignmentControls: boolean;
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
}) {
  return (
    <div className={`editable-rows ${showAlignmentControls ? 'with-alignments' : ''}`} onKeyDown={onKeyDown}>
      <div className="row-head"><span>年</span><span>月</span><span>内容</span><span>操作</span></div>
      {rows.map((row, index) => {
        const rowLabel = `${groupLabel}${index + 1}行目`;
        return (
          <div className="edit-row" key={row.id}>
            {(['year', 'month', 'text'] as const).map((field) => {
              const alignmentKey = `${alignmentKind}.${row.id}.${field}`;
              const fieldLabel = `${rowLabel}の${field === 'year' ? '年' : field === 'month' ? '月' : '内容'}`;
              return (
                <div className="row-field" key={field}>
                  <input
                    aria-label={fieldLabel}
                    value={row[field]}
                    placeholder={
                      field === 'year'
                        ? '2020'
                        : field === 'month'
                          ? '4'
                          : alignmentKind === 'histories'
                            ? '株式会社サンプル 入社'
                            : '普通自動車第一種運転免許 取得'
                    }
                    style={{ textAlign: getTextAlignment(alignments, alignmentKey) }}
                    onChange={(event) => onChange(row.id, { [field]: event.target.value } as Partial<T>)}
                  />
                  {showAlignmentControls ? (
                    <TextAlignmentControl label={fieldLabel} alignment={getTextAlignment(alignments, alignmentKey)} onChange={(alignment) => onAlignmentChange(alignmentKey, alignment)} />
                  ) : null}
                </div>
              );
            })}
            <div className="row-actions">
              <button type="button" onClick={() => onMove(row.id, -1)} aria-label={`${rowLabel}を上へ移動`} disabled={index === 0}>↑</button>
              <button type="button" onClick={() => onMove(row.id, 1)} aria-label={`${rowLabel}を下へ移動`} disabled={index === rows.length - 1}>↓</button>
              <button type="button" onClick={() => onRemove(row.id)} aria-label={`${rowLabel}を削除`}>削除</button>
            </div>
          </div>
        );
      })}
      <button type="button" className="secondary" onClick={onAdd}>{addLabel}</button>
    </div>
  );
}
