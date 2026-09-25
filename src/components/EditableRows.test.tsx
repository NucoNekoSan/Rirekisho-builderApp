import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EditableRows } from './EditableRows';
import type { HistoryEntry } from '../lib/types';

describe('EditableRows', () => {
  it('routes editing, alignment, movement, removal, addition, and keyboard events', () => {
    const rows: HistoryEntry[] = [
      { id: 'one', year: '2020', month: '4', text: '入社' },
      { id: 'two', year: '2024', month: '3', text: '退社' },
    ];
    const onChange = vi.fn();
    const onAdd = vi.fn();
    const onRemove = vi.fn();
    const onMove = vi.fn();
    const onAlignmentChange = vi.fn();
    const onKeyDown = vi.fn();

    render(
      <EditableRows
        rows={rows}
        groupLabel="学歴・職歴"
        onChange={onChange}
        onAdd={onAdd}
        onRemove={onRemove}
        onMove={onMove}
        addLabel="学歴・職歴を追加"
        alignmentKind="histories"
        alignments={{}}
        onAlignmentChange={onAlignmentChange}
        showAlignmentControls
        onKeyDown={onKeyDown}
      />,
    );

    fireEvent.change(screen.getByLabelText('学歴・職歴1行目の年'), { target: { value: '2021' } });
    const alignmentGroup = screen.getByRole('group', { name: '学歴・職歴1行目の年の文字揃え' });
    fireEvent.click(within(alignmentGroup).getByRole('button', { name: '中央' }));
    fireEvent.click(screen.getByRole('button', { name: '学歴・職歴1行目を下へ移動' }));
    fireEvent.click(screen.getByRole('button', { name: '学歴・職歴2行目を上へ移動' }));
    fireEvent.click(screen.getByRole('button', { name: '学歴・職歴1行目を削除' }));
    fireEvent.click(screen.getByRole('button', { name: '学歴・職歴を追加' }));
    fireEvent.keyDown(screen.getByLabelText('学歴・職歴1行目の内容'), { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith('one', { year: '2021' });
    expect(onAlignmentChange).toHaveBeenCalledWith('histories.one.year', 'center');
    expect(onMove.mock.calls).toEqual([['one', 1], ['two', -1]]);
    expect(onRemove).toHaveBeenCalledWith('one');
    expect(onAdd).toHaveBeenCalledOnce();
    expect(onKeyDown).toHaveBeenCalledOnce();
  });
});
